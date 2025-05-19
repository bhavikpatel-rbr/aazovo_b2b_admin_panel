import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Affix from '@/components/shared/Affix'
import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import PrimarySelectSection from './components/PrimaryDetailSection'
import TradeInformation from './components/TradeInformation'
import CompanyInformationDetailSection from './components/CompanyInformation'
import CertificateDetailSection from './components/Certificates'
import Navigator from './components/Navigator'
import useLayoutGap from '@/utils/hooks/useLayoutGap'
import useResponsive from '@/utils/hooks/useResponsive'
import isEmpty from 'lodash/isEmpty'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import type {
    CompanyFormSchema,
} from './types'
import type { CommonProps } from '@/@types/common'
import BranchesDetailSection from './components/Branches'
import KYCDetailSection from './components/KYC'

type CompanyFormProps = {
    children: ReactNode
    onFormSubmit: (values: CompanyFormSchema) => void
    defaultValues?: CompanyFormSchema
    newCompany?: boolean
} & CommonProps

const CompanyForm = (props: CompanyFormProps) => {
    const { onFormSubmit, children, defaultValues  } = props


    const { getTopGapValue } = useLayoutGap()

    const { larger } = useResponsive()

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
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
                                <KYCDetailSection control={control} errors={errors}/>
                            </div>
                        </div>
                    </div>
                </Container>
                {/* <BottomStickyBar>{children}</BottomStickyBar> */}
            </Form>
        </div>
    )
}

export default CompanyForm
