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
                {/* Plan Name */}
                <FormItem label="Plan Name" invalid={Boolean(errors.plan_name)} errorMessage={errors.plan_name?.message}>
                    <Controller
                        name="plan_name"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="e.g., Premium Plan" {...field} />
                        )}
                    />
                </FormItem>

                {/* Plan Type */}
                <FormItem label="Plan Type" invalid={Boolean(errors.plan_type)} errorMessage={errors.plan_type?.message}>
                    <Controller
                        name="plan_type"
                        control={control}
                        render={() => (
                            <Select placeholder="Select Plan Type"
                            options={[
                                { value: 'Monthly', label: 'Monthly' },
                                { value: 'Yearly', label: 'Yearly' },
                            ]}
                            />
                        )}
                    />
                </FormItem>

                {/* Price */}
                <FormItem label="Price" invalid={Boolean(errors.plan_price)} errorMessage={errors.plan_price?.message}>
                    <Controller
                        name="plan_price"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Enter price" {...field} />
                        )}
                    />
                </FormItem>

                {/* Product Limit */}
                <FormItem label="Product Limit" invalid={Boolean(errors.product_limit)} errorMessage={errors.product_limit?.message}>
                    <Controller
                        name="product_limit"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Maximum products" {...field} />
                        )}
                    />
                </FormItem>

                {/* Enquiry Limit */}
                <FormItem label="Enquiry Limit" invalid={Boolean(errors.enquiry_limit)} errorMessage={errors.enquiry_limit?.message}>
                    <Controller
                        name="enquiry_limit"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Monthly enquiry limit" {...field} />
                        )}
                    />
                </FormItem>

                {/* Duration (Days) */}
                <FormItem label="Duration (Days)" invalid={Boolean(errors.plan_duration_days)} errorMessage={errors.plan_duration_days?.message}>
                    <Controller
                        name="plan_duration_days"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="e.g., 30" {...field} />
                        )}
                    />
                </FormItem>

                {/* Marketplace Access */}
                <FormItem label="Marketplace Access" invalid={Boolean(errors.marketplace_access)} errorMessage={errors.marketplace_access?.message}>
                    <Controller
                        name="marketplace_access"
                        control={control}
                        render={() => (
                            <Select placeholder="Select"
                            options={[
                                { value: 'Yes', label: 'Yes' },
                                { value: 'No', label: 'No' },
                                { value: 'Pending', label: 'Pending' },
                            ]}
                            >
                            </Select>
                        )}
                    />
                </FormItem>

                {/* Support Level */}
                <FormItem label="Support Level" invalid={Boolean(errors.support_level)} errorMessage={errors.support_level?.message}>
                    <Controller
                        name="support_level"
                        control={control}
                        render={() => (
                            <Select placeholder="Select support level" 
                            options={[
                                { value: 'Basic', label: 'Basic' },
                                { value: 'Email-only', label: 'Email-only' },
                            ]}
                            >
                            </Select>
                        )}
                    />
                </FormItem>

                {/* Plan Status */}
                <FormItem label="Status" invalid={Boolean(errors.plan_status)} errorMessage={errors.plan_status?.message}>
                    <Controller
                        name="plan_status"
                        control={control}
                        render={() => (
                            <Select placeholder="Select status"
                            options={[
                                { value: 'Active', label: 'Active' },
                                { value: 'Inactive', label: 'Inactive' },
                            ]}
                            >
                            </Select>
                        )}
                    />
                </FormItem>
            </div>
        </Card>

    )
}

export default MemebershipPlanDetails
