import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import { Button } from '@/components/ui'
import { TbPlus } from 'react-icons/tb'

// --- Mock Options Data (Replace with real data as needed) ---
const bankNameOptions = [
    { value: 'hdfc', label: 'HDFC Bank' },
    { value: 'sbi', label: 'State Bank of India' },
    { value: 'icici', label: 'ICICI Bank' },
    // ... other banks
]
// --- End Mock Options Data ---

const BankDetailsSection = ({
    control,
    errors,
}: FormSectionBaseProps) => {
    return (
        <Card id="bankDetails">
            <h4 className="mb-6">Bank Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Primary Account Number */}
                <FormItem
                    label="Primary Account Number"
                    invalid={Boolean(errors.primary_account_number)}
                    errorMessage={errors.primary_account_number?.message as string}
                >
                    <Controller
                        name="primary_account_number"
                        control={control}
                        rules={{ required: 'Primary Account Number is required' }}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Primary Account Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Primary Bank Name */}
                <FormItem
                    label="Primary Bank Name"
                    invalid={Boolean(errors.primary_bank_name)}
                    errorMessage={errors.primary_bank_name?.message as string}
                >
                    <Controller
                        name="primary_bank_name"
                        control={control}
                        rules={{ required: 'Primary Bank Name is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Bank"
                                options={bankNameOptions}
                                value={bankNameOptions.find(option => option.value === field.value)}
                                onChange={option => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Primary IFSC Code */}
                <FormItem
                    label="Primary IFSC Code"
                    invalid={Boolean(errors.primary_ifsc_code)}
                    errorMessage={errors.primary_ifsc_code?.message as string}
                >
                    <Controller
                        name="primary_ifsc_code"
                        control={control}
                        rules={{ required: 'Primary IFSC Code is required' }}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Primary IFSC Code"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Primary Bank Verification Photo */}
                <FormItem
                    label="Primary Bank Verification Photo"
                    invalid={Boolean(errors.primary_bank_verification_photo)}
                    errorMessage={errors.primary_bank_verification_photo?.message as string}
                    className="md:col-span-3"
                >
                    <Controller
                        name="primary_bank_verification_photo"
                        control={control}
                        rules={{ required: 'Primary Bank Verification Photo is required' }}
                        render={({ field }) => (
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => field.onChange(e.target.files?.[0])}
                            />
                        )}
                    />
                </FormItem>

                {/* Secondary Account Number */}
                <FormItem
                    label="Secondary Account Number"
                    invalid={Boolean(errors.secondary_account_number)}
                    errorMessage={errors.secondary_account_number?.message as string}
                >
                    <Controller
                        name="secondary_account_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Secondary Account Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Secondary Bank Name */}
                <FormItem
                    label="Secondary Bank Name"
                    invalid={Boolean(errors.secondary_bank_name)}
                    errorMessage={errors.secondary_bank_name?.message as string}
                >
                    <Controller
                        name="secondary_bank_name"
                        control={control}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Bank"
                                options={bankNameOptions}
                                value={bankNameOptions.find(option => option.value === field.value)}
                                onChange={option => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Secondary IFSC Code */}
                <FormItem
                    label="Secondary IFSC Code"
                    invalid={Boolean(errors.secondary_ifsc_code)}
                    errorMessage={errors.secondary_ifsc_code?.message as string}
                >
                    <Controller
                        name="secondary_ifsc_code"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Secondary IFSC Code"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Secondary Bank Verification Photo */}
                <FormItem
                    label="Secondary Bank Verification Photo"
                    invalid={Boolean(errors.secondary_bank_verification_photo)}
                    errorMessage={errors.secondary_bank_verification_photo?.message as string}
                    className="md:col-span-3"
                >
                    <Controller
                        name="secondary_bank_verification_photo"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => field.onChange(e.target.files?.[0])}
                            />
                        )}
                    />
                </FormItem>
            </div>
            <div className='flex justify-end'>
                <Button type='button' icon={<TbPlus/>}>Add More</Button>
            </div>
        </Card>
    )
}

export default BankDetailsSection
