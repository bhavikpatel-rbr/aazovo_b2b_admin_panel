import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'

type MemebershipPlanDetailSectionProps = FormSectionBaseProps

const MemebershipPlanDetails = ({
    control,
    errors,
}: MemebershipPlanDetailSectionProps) => {
    return (
        <Card id="membershipPlanDetails">
            <h4 className="mb-6">Membership Plan Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
                {/* Membership Plan (Text) */}
                <FormItem label="Membership Plan">
                    <Input type="text" placeholder="e.g., Premium Plan" />
                </FormItem>

                {/* Upgrade Your Plan (Select) */}
                <FormItem label="Upgrade Your Plan" invalid={Boolean(errors.upgrade_plan)} errorMessage={errors.upgrade_plan?.message}>
                    <Controller
                        name="upgrade_plan"
                        control={control}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Plan"
                                options={[
                                    { value: 'Basic', label: 'Basic' },
                                    { value: 'Premium', label: 'Premium' },
                                    { value: 'Enterprise', label: 'Enterprise' },
                                ]}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default MemebershipPlanDetails
