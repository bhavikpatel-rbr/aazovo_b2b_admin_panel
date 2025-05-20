import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select' // Import Select
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps, CompanyFormSchema } from '../types' // Assuming CompanyFormSchema is needed

type BranchesDetailSectionProps = FormSectionBaseProps

// --- Mock Options Data (Replace with your actual data sources) ---
const countryOptions = [ // Example, you might use your countryList constant
    { value: 'IN', label: 'India' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    // ... more countries
];

const stateOptions = [ // These would typically be filtered by selected country
    { value: 'MH', label: 'Maharashtra' }, // India
    { value: 'KA', label: 'Karnataka' },   // India
    { value: 'CA', label: 'California' },  // US
    { value: 'NY', label: 'New York' },    // US
    { value: 'ON', label: 'Ontario' },     // Canada
    // ... more states
];
// --- End Mock Options Data ---


const BranchesDetailSection = ({
    control,
    errors,
}: BranchesDetailSectionProps) => {

    return (
        <Card id="branches">
            <h4 className="mb-6">Branch / Head Office Information</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem
                    label="Head Office" // Or Branch Name
                    invalid={Boolean(errors.head_office)}
                    errorMessage={errors.head_office?.message as string}
                >
                    <Controller
                        name="head_office" // Or branch_name
                        control={control}
                        rules={{ required: 'Office/Branch name is required' }}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="e.g., Main Office, Mumbai Branch"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Location Country as Select */}
                <FormItem
                    label="Location Country"
                    invalid={Boolean(errors.location_country)}
                    errorMessage={errors.location_country?.message as string}
                >
                    <Controller
                        name="location_country" // Ensure this field exists in CompanyFormSchema
                        control={control}
                        rules={{ required: 'Country is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Country"
                                options={countryOptions}
                                value={countryOptions.find(option => option.value === field.value)}
                                onChange={(option) => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* State as Select */}
                <FormItem
                    label="State"
                    invalid={Boolean(errors.branch_state)}
                    errorMessage={errors.branch_state?.message as string}
                >
                    <Controller
                        name="branch_state" // Ensure this field exists in CompanyFormSchema
                        control={control}
                        rules={{ required: 'State is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select State"
                                options={stateOptions} // Ideally, filter these based on selected country
                                value={stateOptions.find(option => option.value === field.value)}
                                onChange={(option) => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="ZIP Code"
                    invalid={Boolean(errors.branch_zip_code)}
                    errorMessage={errors.branch_zip_code?.message as string}
                >
                    <Controller
                        name="branch_zip_code"
                        control={control}
                        rules={{ required: 'ZIP Code is required' }}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="ZIP / Postal Code"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Address - Spanning 2 columns for more space if using md:grid-cols-2 */}
                <FormItem
                    label="Address"
                    className="md:col-span-2" // Make Address take full width on medium screens
                    invalid={Boolean(errors.branch_address)}
                    errorMessage={errors.branch_address?.message as string}
                >
                    <Controller
                        name="branch_address"
                        control={control}
                        rules={{ required: 'Address is required' }}
                        render={({ field }) => (
                            <Input
                                type="text" // Consider textarea if your Input component supports it or use a dedicated one
                                autoComplete="off"
                                placeholder="Full Address (Street, City, etc.)"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="GST/REG Number"
                    invalid={Boolean(errors.branch_gst_reg_number)}
                    errorMessage={errors.branch_gst_reg_number?.message as string}
                >
                    <Controller
                        name="branch_gst_reg_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="GST or Registration Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default BranchesDetailSection