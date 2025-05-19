import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Affix from '@/components/shared/Affix'
import Card from '@/components/ui/Card'
import Container from '@/components/shared/Container'
import Navigator from './components/Navigator'
import useLayoutGap from '@/utils/hooks/useLayoutGap'
import useResponsive from '@/utils/hooks/useResponsive'
import isEmpty from 'lodash/isEmpty'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import type {
    MemberFormSchema,
} from './types'
import type { CommonProps } from '@/@types/common'
import PersonalDetails from './components/PersonalDetails'
import ContactDetails from './components/Contact'
import MemberAccessibility from './components/MemberAccessibility'
import MembershipPlan from './components/MembershipPlan'
import RequestAndFeedbacks from './components/RequestAndFeedbacks'
type MemberFormProps = {
    children: ReactNode
    onFormSubmit: (values: MemberFormSchema) => void
    defaultValues?: MemberFormSchema
    // defaultProducts?: SelectedProduct[]
    newMember?: boolean
} & CommonProps

const MemberForm = (props: MemberFormProps) => {
    const { onFormSubmit, children, defaultValues  } = props

    const { getTopGapValue } = useLayoutGap()

    const { larger } = useResponsive()

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSubmit = (values: MemberFormSchema) => {
        onFormSubmit?.(values)
    }

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<MemberFormSchema>({
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
                                <PersonalDetails errors={errors} control={control} />
                                <ContactDetails errors={errors} control={control} />
                                <MemberAccessibility errors={errors} control={control} />
                                <MembershipPlan errors={errors} control={control} />
                                <RequestAndFeedbacks errors={errors} control={control} />
                            </div>
                        </div>
                    </div>
                </Container>
                {/* <BottomStickyBar>{children}</BottomStickyBar> */}
            </Form>
        </div>
    )
}

export default MemberForm
