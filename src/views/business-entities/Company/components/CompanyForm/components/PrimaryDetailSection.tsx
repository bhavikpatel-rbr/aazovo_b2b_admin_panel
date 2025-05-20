import { useMemo } from 'react' // Keep if used elsewhere, not directly here
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select' // Import Select
import { FormItem } from '@/components/ui/Form'
// import { countryList } from '@/constants/countries.constant' // Keep if you use it for Country select
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps, CompanyFormSchema } from '../types' // Assuming CompanyFormSchema is needed for field names
type PrimaryDetailSectionProps = FormSectionBaseProps

// --- Mock Options Data (Replace with your actual data sources) ---
const ownershipTypeOptions = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_limited', label: 'Private Limited Company' },
    { value: 'public_limited', label: 'Public Limited Company' },
    { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
    { value: 'other', label: 'Other' },
]

// For City, State, Country, Continent - you'll likely fetch these or have them as constants
// For simplicity, I'm using placeholder options.
// It's common for City and State to be dependent on the selected Country.
const countryOptions = [ // Example, you might use your countryList constant
    { value: 'IN', label: 'India' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    // ... more countries
];

const stateOptions = [ // These would typically be filtered by selected country
    { value: 'MH', label: 'Maharashtra' },
    { value: 'CA', label: 'California' },
    // ... more states
];

const cityOptions = [ // These would typically be filtered by selected state
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'LosAngeles', label: 'Los Angeles' },
    // ... more cities
];

const continentOptions = [
    { value: 'AS', label: 'Asia' },
    { value: 'NA', label: 'North America' },
    { value: 'EU', label: 'Europe' },
    { value: 'AF', label: 'Africa' },
    { value: 'SA', label: 'South America' },
    { value: 'OC', label: 'Oceania/Australia' },
    { value: 'AN', label: 'Antarctica' },
];
// --- End Mock Options Data ---


const PrimaryDetailSection = ({
    control,
    errors,
}: PrimaryDetailSectionProps) => {

    return (
    <Card id="companyDetails">
        <h4 className="mb-6">Primary Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
            <FormItem
                label="Company Name"
                invalid={Boolean(errors.company_name)}
                errorMessage={errors.company_name?.message as string}
            >
                <Controller
                    name="company_name"
                    control={control}
                    rules={{ required: 'Company Name is required' }} // Example rule
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Company Name"
                            {...field}
                        />
                    )}
                />
            </FormItem>
            <FormItem
                label="Company Primary Contact Number"
                invalid={Boolean(errors.company_primary_contact_number)}
                errorMessage={errors.company_primary_contact_number?.message as string}
            >
                <Controller
                    name="company_primary_contact_number"
                    control={control}
                    rules={{ required: 'Primary Contact Number is required' }}
                    render={({ field }) => (
                        <Input
                            type="tel" // Changed to tel for better mobile UX
                            autoComplete="off"
                            placeholder="Primary Contact Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            {/* New Country Code Input */}
            <FormItem
                label="Country Code (Alternate)"
                // Assuming you'll add a field like 'alternate_contact_country_code' to your schema
                invalid={Boolean(errors.alternate_contact_country_code)}
                errorMessage={errors.alternate_contact_country_code?.message as string}
            >
                <Controller
                    name="alternate_contact_country_code" // Ensure this field exists in your CompanyFormSchema
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="+1"
                            className="w-24" // Make it narrower
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Alternate Contact Number"
                invalid={Boolean(errors.alternate_contact_number)}
                errorMessage={errors.alternate_contact_number?.message as string}
            >
                <Controller
                    name="alternate_contact_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="tel" // Changed to tel
                            autoComplete="off"
                            placeholder="Alternate Contact Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Company Primary E-mail ID"
                invalid={Boolean(errors.company_primary_email_id)}
                errorMessage={errors.company_primary_email_id?.message as string}
            >
                <Controller
                    name="company_primary_email_id"
                    control={control}
                    rules={{ required: 'Primary Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } }}
                    render={({ field }) => (
                        <Input
                            type="email"
                            autoComplete="off"
                            placeholder="Primary Email ID"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Alternate E-mail ID"
                invalid={Boolean(errors.alternate_email_id)}
                errorMessage={errors.alternate_email_id?.message as string}
            >
                <Controller
                    name="alternate_email_id"
                    control={control}
                    rules={{ pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } }}
                    render={({ field }) => (
                        <Input
                            type="email"
                            autoComplete="off"
                            placeholder="Alternate Email ID"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            {/* Ownership Type as Select */}
            <FormItem
                label="Ownership Type"
                invalid={Boolean(errors.ownership_type)}
                errorMessage={errors.ownership_type?.message as string}
            >
                <Controller
                    name="ownership_type" // Ensure this field and its type are in CompanyFormSchema
                    control={control}
                    rules={{ required: 'Ownership type is required' }}
                    render={({ field }) => ( // field.value, field.onChange
                        <Select
                            placeholder="Select Ownership Type"
                            options={ownershipTypeOptions}
                            value={ownershipTypeOptions.find(option => option.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                            {...field} // Pass rest of the field props if Select supports them
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Owner/Director/Proprietor Name"
                invalid={Boolean(errors.owner_director_proprietor_name)}
                errorMessage={errors.owner_director_proprietor_name?.message as string}
            >
                <Controller
                    name="owner_director_proprietor_name"
                    control={control}
                    rules={{ required: 'Owner/Director/Proprietor Name is required' }}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Owner / Director / Proprietor Name"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Company Address"
                invalid={Boolean(errors.company_address)}
                errorMessage={errors.company_address?.message as string}
            >
                <Controller
                    name="company_address"
                    control={control}
                    rules={{ required: 'Company Address is required' }}
                    render={({ field }) => (
                        <Input
                            // Consider using a textarea for address if your Input component doesn't support multiline well
                            // Or use a dedicated AddressInput component if you have one
                            type="text"
                            autoComplete="off"
                            placeholder="Company Address"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            {/* Country as Select */}
            <FormItem
                label="Country"
                invalid={Boolean(errors.country)}
                errorMessage={errors.country?.message as string}
            >
                <Controller
                    name="country" // Ensure this field and its type are in CompanyFormSchema
                    control={control}
                    rules={{ required: 'Country is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select Country"
                            options={countryOptions} // Use your actual countryList or fetched data
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
                invalid={Boolean(errors.state)}
                errorMessage={errors.state?.message as string}
            >
                <Controller
                    name="state" // Ensure this field and its type are in CompanyFormSchema
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

            {/* City as Select */}
            <FormItem
                label="City"
                invalid={Boolean(errors.city)}
                errorMessage={errors.city?.message as string}
            >
                <Controller
                    name="city" // Ensure this field and its type are in CompanyFormSchema
                    control={control}
                    rules={{ required: 'City is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select City"
                            options={cityOptions} // Ideally, filter these based on selected state
                            value={cityOptions.find(option => option.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                            {...field}
                        />
                    )}
                />
            </FormItem>


            <FormItem
                label="ZIP / Postal Code"
                invalid={Boolean(errors.zip_postal_code)}
                errorMessage={errors.zip_postal_code?.message as string}
            >
                <Controller
                    name="zip_postal_code"
                    control={control}
                    rules={{ required: 'ZIP/Postal Code is required' }}
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


            {/* Continent Name as Select */}
            <FormItem
                label="Continent Name"
                invalid={Boolean(errors.continent_name)}
                errorMessage={errors.continent_name?.message as string}
            >
                <Controller
                    name="continent_name" // Ensure this field and its type are in CompanyFormSchema
                    control={control}
                    rules={{ required: 'Continent is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select Continent"
                            options={continentOptions}
                            value={continentOptions.find(option => option.value === field.value)}
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

export default PrimaryDetailSection