import Card from '@/components/ui/Card'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'
import { Option } from '@/components/ui/Select'
type ContactDetailSectionProps = FormSectionBaseProps
const ContactDetails = ({
    control,
    errors,
}: ContactDetailSectionProps) => {

    return (
<Card id="memberAccessibility" className="mt-6">
    <h4 className="mb-6">Member Accessibility</h4>
    <div className="grid md:grid-cols-2 gap-4">
        {/* KYC Verified */}
        <FormItem label="KYC Verified" invalid={Boolean(errors.kyc_verified)} errorMessage={errors.kyc_verified?.message}>
            <Controller
                name="kyc_verified"
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

        {/* Permanent ID */}
        <FormItem label="Permanent ID" invalid={Boolean(errors.permanent_id)} errorMessage={errors.permanent_id?.message}>
            <Controller
                name="permanent_id"
                control={control}
                render={() => (
                    <Select placeholder="Select"
                    options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                    ]}
                    >
                        
                    </Select>
                )}
            />
        </FormItem>

        {/* Product Upload Permission */}
        <FormItem label="Product Upload Permission" invalid={Boolean(errors.product_upload_permission)} errorMessage={errors.product_upload_permission?.message}>
            <Controller
                name="product_upload_permission"
                control={control}
                render={() => (
                    <Select placeholder="Select"
                    options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                    ]}
                    >
                    </Select>
                )}
            />
        </FormItem>

        {/* Wall Enquiry Permission */}
        <FormItem label="Wall Enquiry Permission" invalid={Boolean(errors.wall_enquiry_permission)} errorMessage={errors.wall_enquiry_permission?.message}>
            <Controller
                name="wall_enquiry_permission"
                control={control}
                render={() => (
                    <Select placeholder="Select"
                    options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                        { value: 'Disabled', label: 'Disabled' },
                    ]}
                    >
                    </Select>
                )}
            />
        </FormItem>

        {/* Enquiry Permission */}
        <FormItem label="Enquiry Permission" invalid={Boolean(errors.enquiry_permission)} errorMessage={errors.enquiry_permission?.message}>
            <Controller
                name="enquiry_permission"
                control={control}
                render={() => (
                    <Select placeholder="Select"
                    options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                    ]}
                    >
                    </Select>
                )}
            />
        </FormItem>

        {/* Profile Visibility */}
        <FormItem label="Profile Visibility" invalid={Boolean(errors.profile_visibility)} errorMessage={errors.profile_visibility?.message}>
            <Controller
                name="profile_visibility"
                control={control}
                render={({  }) => (
                    <Select placeholder="Select"
                    options={[
                        { value: 'Public', label: 'Public' },
                        { value: 'Private', label: 'Private' },
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

export default ContactDetails
