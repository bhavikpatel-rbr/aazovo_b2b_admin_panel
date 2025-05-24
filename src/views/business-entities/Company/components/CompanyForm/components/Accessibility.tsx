import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import { Button } from '@/components/ui'
import { TbPlus } from 'react-icons/tb'

// --- Mock Options Data (Replace with real data as needed) ---
const domainOptions = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'services', label: 'Services' },
    // ... other domains
];
// --- End Mock Options Data ---

const AccessibilitySection = ({
    control,
    errors,
}: FormSectionBaseProps) => {
    return (
        <Card id="accessibility">
            <h4 className="mb-6">Accessibility</h4>
            <div className="md:grid md:grid-cols-2 lg:grid-cols-7 lg:gap-2">
                {/* KYC Verified */}
                <FormItem
                    label="KYC Verified"
                    invalid={Boolean(errors.KYC_FIELD)}
                    errorMessage={errors.KYC_FIELD?.message as string}
                    className="col-span-1 lg:col-span-3"
                >
                    <Controller
                        name="KYC_FIELD"
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
                    invalid={Boolean(errors.BILLING_FIELD)}
                    errorMessage={errors.BILLING_FIELD?.message as string}
                    className="col-span-1 lg:col-span-4"
                >
                    <Controller
                        name="BILLING_FIELD"
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
                <div className='md:grid grid-cols-2 lg:grid-cols-7 gap-2 col-span-7 mb-6 lg:mb-0'>
                    <FormItem
                        label="Enable Billing Documents"
                        className="lg:col-span-3"
                    >
                        <Controller
                            name="BILLING_PHOTOS_FIELD"
                            control={control}
                            render={({ field }) => (
                                <Input type="text" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Enable Billing Documents"
                        invalid={Boolean(errors.BILLING_PHOTOS_FIELD)}
                        errorMessage={errors.BILLING_PHOTOS_FIELD?.message as string}
                        className="lg:col-span-3"
                    >
                        <Controller
                            name="BILLING_PHOTOS_FIELD"
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
                    <div className='flex lg:justify-center items-center'>
                        <Button type='button' icon={<TbPlus />}>Add More</Button>
                    </div>
                </div>

                {/* Domain Management */}
                <FormItem
                    label="Domain Management"
                    invalid={Boolean(errors.DOMAIN_MANAGEMENT_FIELD)}
                    errorMessage={errors.DOMAIN_MANAGEMENT_FIELD?.message as string}
                    className="md:col-span-2 lg:col-span-7"
                >
                    <Controller
                        name="DOMAIN_MANAGEMENT_FIELD"
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
