import Card from '@/components/ui/Card'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'

type ContactDetailSectionProps = FormSectionBaseProps

const ContactDetails = ({
    control,
    errors,
}: ContactDetailSectionProps) => {

    return (
        <Card id="memberAccessibility">
            <h4 className="mb-6">Member Accessibility</h4>
            <div className="grid md:grid-cols-3 gap-4">
                {/* Product Upload Enable (Checkboxes for Yes/No) */}
                <FormItem label="Product Upload Enable" invalid={Boolean(errors.product_upload_enable)} errorMessage={errors.product_upload_enable?.message}>
                    <Controller
                        name="product_upload_enable"
                        control={control}
                        render={({ field }) => (
                            <div className="flex gap-4">
                                <Checkbox
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                >
                                    Yes
                                </Checkbox>
                                <Checkbox
                                    checked={field.value === false}
                                    onChange={() => field.onChange(false)}
                                >
                                    No
                                </Checkbox>
                            </div>
                        )}
                    />
                </FormItem>

                {/* Wall Listing Enable (Checkboxes for Yes/No) */}
                <FormItem label="Wall Listing Enable" invalid={Boolean(errors.wall_listing_enable)} errorMessage={errors.wall_listing_enable?.message}>
                    <Controller
                        name="wall_listing_enable"
                        control={control}
                        render={({ field }) => (
                            <div className="flex gap-4">
                                <Checkbox
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                >
                                    Yes
                                </Checkbox>
                                <Checkbox
                                    checked={field.value === false}
                                    onChange={() => field.onChange(false)}
                                >
                                    No
                                </Checkbox>
                            </div>
                        )}
                    />
                </FormItem>

                {/* Trade Inquiry Allowed (Select) */}
                <FormItem label="Trade Inquiry Allowed" invalid={Boolean(errors.trade_inquiry_allowed)} errorMessage={errors.trade_inquiry_allowed?.message}>
                    <Controller
                        name="trade_inquiry_allowed"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                placeholder="Select"
                                options={[
                                    { value: 'Yes', label: 'Yes' },
                                    { value: 'No', label: 'No' },
                                ]}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default ContactDetails
