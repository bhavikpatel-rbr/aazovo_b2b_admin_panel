import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Affix from '@/components/shared/Affix'
import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import BottomStickyBar from '@/components/template/BottomStickyBar'
import PrimarySelectSection from './components/PrimaryDetailSection'
import TradeInformation from './components/TradeInformation'
import CompanyInformationDetailSection from './components/CompanyInformation'
import CertificateDetailSection from './components/Certificates'
import Navigator from './components/Navigator'
import { useCompanyFormStore } from './store/companyFormStore'
import useLayoutGap from '@/utils/hooks/useLayoutGap'
import useResponsive from '@/utils/hooks/useResponsive'
import isEmpty from 'lodash/isEmpty'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ReactNode } from 'react'
import type {
    // GetProductListResponse,
    CompanyFormSchema,
    // SelectedProduct,
} from './types'
import type { TableQueries, CommonProps } from '@/@types/common'
import { Certificate } from 'crypto'
import BranchesDetailSection from './components/Branches'
import KYCDetailSection from './components/KYC'

type CompanyFormProps = {
    children: ReactNode
    onFormSubmit: (values: CompanyFormSchema) => void
    defaultValues?: CompanyFormSchema
    // defaultProducts?: SelectedProduct[]
    newCompany?: boolean
} & CommonProps

const baseValidationSchema = z.object({
    firstName: z.string().min(1, { message: 'First name required' }),
    lastName: z.string().min(1, { message: 'Last name required' }),
    email: z
        .string()
        .min(1, { message: 'Email required' })
        .email({ message: 'Invalid email' }),
    dialCode: z.string().min(1, { message: 'Please select your country code' }),
    phoneNumber: z
        .string()
        .min(1, { message: 'Please input your mobile number' }),
    country: z.string().min(1, { message: 'Please select a country' }),
    address: z.string().min(1, { message: 'Addrress required' }),
    postcode: z.string().min(1, { message: 'Postcode required' }),
    city: z.string().min(1, { message: 'City required' }),
})

const CompanyForm = (props: CompanyFormProps) => {
    const { onFormSubmit, children, defaultValues  } = props

    const { setProductOption, setProductList, setSelectedProduct } =
        useCompanyFormStore()

    const { getTopGapValue } = useLayoutGap()

    const { larger } = useResponsive()

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
        return () => {
            setSelectedProduct([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSubmit = (values: CompanyFormSchema) => {
        onFormSubmit?.(values)
    }

    const {
        handleSubmit,
        reset,
        watch,
        formState: { errors },
        control,
    } = useForm<CompanyFormSchema>({
        defaultValues: {
            ...(defaultValues ? defaultValues : {}),
        },
    })


    return (
        <div className="flex">
            <Form
                className="flex-1 flex flex-col overflow-hidden"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Container>
                    <div className="flex gap-4">
                        {larger.xl && (
                            <div className="w-[337px]">
                                <Affix offset={getTopGapValue()}>
                                    <Card>
                                        <Navigator />
                                    </Card>
                                </Affix>
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex flex-col gap-4">
                                <PrimarySelectSection control={control} errors={errors} />
                                <TradeInformation control={control} errors={errors} />
                                <CompanyInformationDetailSection control={control} errors={errors} />
                                <CertificateDetailSection control={control} errors={errors} />
                                <BranchesDetailSection control={control} errors={errors} />
                                {/* <KYCDetailSection control={control} errors={errors}/> */}
                            </div>
                        </div>
                    </div>
                </Container>
                <BottomStickyBar>{children}</BottomStickyBar>
            </Form>
        </div>
    )
}

export default CompanyForm
