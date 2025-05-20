import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select' // Import Select
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps, CompanyFormSchema } from '../types' // Assuming CompanyFormSchema is needed for field names
import NumericInput from '@/components/shared/NumericInput'

type CompanyInformationDetailSectionProps = FormSectionBaseProps

// --- Mock Options Data (Replace with your actual data sources) ---
const primaryBusinessTypeOptions = [
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'exporter', label: 'Exporter' },
    { value: 'importer', label: 'Importer' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'trader', label: 'Trader' },
    { value: 'other', label: 'Other' },
];

const primaryBusinessCategoryOptions = [ // These would likely be more specific to your application
    { value: 'electronics', label: 'Electronics' },
    { value: 'automotive', label: 'Automotive Parts' },
    { value: 'apparel', label: 'Apparel & Fashion' },
    { value: 'construction', label: 'Construction Materials' },
    { value: 'agriculture', label: 'Agricultural Products' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'it_services', label: 'IT Services' },
    { value: 'other', label: 'Other' },
];
// --- End Mock Options Data ---

const CompanyInformationDetailSection = ({
    control,
    errors,
}: CompanyInformationDetailSectionProps) => {

    return (
        <Card id="companyInformation">
            <h4 className="mb-6">Company Information</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem
                    label="Establishment Year"
                    invalid={Boolean(errors.company_establishment_year)}
                    errorMessage={errors.company_establishment_year?.message as string}
                >
                    <Controller
                        name="company_establishment_year"
                        control={control}
                        rules={{ pattern: { value: /^\d{4}$/, message: 'Enter a valid year (YYYY)'} }}
                        render={({ field }) => (
                            <Input
                                type="text" // Could be number, but text allows for easier validation display
                                maxLength={4}
                                autoComplete="off"
                                placeholder="e.g., 2005"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="No. of Employees"
                    invalid={Boolean(errors.no_of_employees)}
                    errorMessage={errors.no_of_employees?.message as string}
                >
                    <Controller
                        name="no_of_employees"
                        control={control}
                        render={({ field }) => (
                            // Assuming NumericInput handles value/onChange correctly for RHF
                            <NumericInput
                                placeholder="e.g., 100"
                                value={field.value as number | undefined} // Ensure value is number or undefined
                                onChange={(value) => field.onChange(value)} // Ensure onChange provides the number
                                onBlur={field.onBlur}
                                // You might need to pass name and ref from field if NumericInput requires them directly
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Company Website"
                    invalid={Boolean(errors.company_website)}
                    errorMessage={errors.company_website?.message as string}
                >
                    <Controller
                        name="company_website"
                        control={control}
                        rules={{ pattern: { value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, message: 'Enter a valid URL' } }}
                        render={({ field }) => (
                            <Input
                                type="url"
                                autoComplete="off"
                                placeholder="e.g., https://example.com"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Company Logo/Brochure"
                    invalid={Boolean(errors.company_logo_brochure)}
                    errorMessage={errors.company_logo_brochure?.message as string}
                >
                    <Controller
                        name="company_logo_brochure" // This name implies it might be a file or a URL string.
                                                    // If it's a file, the Input type="file" is okay.
                                                    // If it's a URL to an already uploaded file, type="url" might be better.
                        control={control}
                        render={({ field }) => {
                            // Handling file input with React Hook Form can be tricky.
                            // The `value` prop on `input type="file"` should not be set directly for uncontrolled behavior.
                            // RHF usually requires a custom onChange handler for files.
                            // For simplicity, if this is just a URL string, change type to "url".
                            // If it's truly a file upload, you'll need a more specific setup.
                            // const { onChange, ...restField } = field; // Omit onChange if handling files manually
                            return (
                                <Input
                                    type="file" // Or "url" if it's a link to the logo/brochure
                                    autoComplete="off"
                                    // value={undefined} // For type="file", value should not be controlled by RHF field.value directly
                                    // onChange={(e) => onChange(e.target.files)} // Example for file upload
                                    {...field} // If it's a URL string, this is fine.
                                />
                            )
                        }}
                    />
                </FormItem>

                {/* Primary Business Type as Select */}
                <FormItem
                    label="Primary Business Type"
                    invalid={Boolean(errors.primary_business_type)}
                    errorMessage={errors.primary_business_type?.message as string}
                >
                    <Controller
                        name="primary_business_type" // Ensure this field exists in CompanyFormSchema
                        control={control}
                        rules={{ required: 'Primary Business Type is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Business Type"
                                options={primaryBusinessTypeOptions}
                                value={primaryBusinessTypeOptions.find(option => option.value === field.value)}
                                onChange={(option) => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Primary Business Category as Select */}
                <FormItem
                    label="Primary Business Category"
                    invalid={Boolean(errors.primary_business_category)}
                    errorMessage={errors.primary_business_category?.message as string}
                >
                    <Controller
                        name="primary_business_category" // Ensure this field exists in CompanyFormSchema
                        control={control}
                        rules={{ required: 'Primary Business Category is required' }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Business Category"
                                options={primaryBusinessCategoryOptions}
                                value={primaryBusinessCategoryOptions.find(option => option.value === field.value)}
                                onChange={(option) => field.onChange(option?.value)}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>

    )
}

export default CompanyInformationDetailSection