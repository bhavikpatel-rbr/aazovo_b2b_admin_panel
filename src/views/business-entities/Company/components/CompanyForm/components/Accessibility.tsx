import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

// --- Mock Options Data (Replace with real data as needed) ---
const domainOptions = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'services', label: 'Services' },
    // ... other domains
];
// --- End Mock Options Data ---

// Use the correct field names from your CompanyFormFields type
// Replace these with the actual field names from your form schema
const KYC_FIELD = 'company_kyc_verified';
const BILLING_FIELD = 'company_enable_billing';
const BILLING_PHOTOS_FIELD = 'company_billing_photos';
const DOMAIN_MANAGEMENT_FIELD = 'company_domain_management';

const AccessibilitySection = ({
    control,
    errors,
}: FormSectionBaseProps) => {
    return (
        <Card id="accessibility">
            <h4 className="mb-6">Accessibility</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* KYC Verified */}
                <FormItem
                    label="KYC Verified"
                    invalid={Boolean(errors[KYC_FIELD])}
                    errorMessage={errors[KYC_FIELD]?.message as string}
                    className="md:col-span-1"
                >
                    <Controller
                        name={KYC_FIELD as any}
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                checked={!!field.value}
                                onChange={field.onChange}
                            >
                                KYC Verified
                            </Checkbox>
                        )}
                    />
                </FormItem>

                {/* Enable Billing */}
                <FormItem
                    label="Enable Billing"
                    invalid={Boolean(errors[BILLING_FIELD])}
                    errorMessage={errors[BILLING_FIELD]?.message as string}
                    className="md:col-span-1"
                >
                    <Controller
                        name={BILLING_FIELD as any}
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                checked={!!field.value}
                                onChange={field.onChange}
                            >
                                Enable Billing
                            </Checkbox>
                        )}
                    />
                </FormItem>

                {/* Enable Billing Photos */}
                <FormItem
                    label="Enable Billing Photos"
                    invalid={Boolean(errors[BILLING_PHOTOS_FIELD])}
                    errorMessage={errors[BILLING_PHOTOS_FIELD]?.message as string}
                    className="md:col-span-3"
                >
                    <Controller
                        name={BILLING_PHOTOS_FIELD as any}
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={e => field.onChange((e.target as HTMLInputElement).files)}
                            />
                        )}
                    />
                </FormItem>

                {/* Domain Management */}
                <FormItem
                    label="Domain Management"
                    invalid={Boolean(errors[DOMAIN_MANAGEMENT_FIELD])}
                    errorMessage={errors[DOMAIN_MANAGEMENT_FIELD]?.message as string}
                    className="md:col-span-1"
                >
                    <Controller
                        name={DOMAIN_MANAGEMENT_FIELD as any}
                        control={control}
                        rules={{ required: 'Domain Management is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Domain"
                                options={domainOptions}
                                getOptionLabel={option => option.label}
                                getOptionValue={option => option.value}
                                value={domainOptions.find(option => option.value === field.value) || null}
                                onChange={option => field.onChange(option ? option.value : '')}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    );
};

export default AccessibilitySection
