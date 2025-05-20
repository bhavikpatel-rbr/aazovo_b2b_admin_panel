import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
// import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps, CompanyFormSchema } from '../types'
import Textarea from '@/views/ui-components/forms/Input/Textarea'

type PrimaryDetailSectionProps = FormSectionBaseProps

// --- Mock Options Data (Keep as is or replace) ---
const ownershipTypeOptions = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_limited', label: 'Private Limited Company' },
    // ... other options
];
const countryOptions = [ { value: 'IN', label: 'India' }, /* ... */ ];
const stateOptions = [ { value: 'MH', label: 'Maharashtra' }, /* ... */ ];
const cityOptions = [ { value: 'Mumbai', label: 'Mumbai' }, /* ... */ ];
const continentOptions = [ { value: 'AS', label: 'Asia' }, /* ... */ ];
// --- End Mock Options Data ---


const PrimaryDetailSection = ({
    control,
    errors,
}: PrimaryDetailSectionProps) => {

    return (
    <Card id="companyDetails">
        <h5 className="mb-6">Primary Information</h5>
        {/* Changed to md:grid-cols-3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Company Name */}
            <FormItem
                label="Company Name"
                invalid={Boolean(errors.company_name)}
                errorMessage={errors.company_name?.message as string}
            >
                <Controller
                    name="company_name"
                    control={control}
                    rules={{ required: 'Company Name is required' }}
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

            {/* Company Primary Contact Number */}
            {/* <FormItem
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
                            type="tel"
                            autoComplete="off"
                            placeholder="Primary Contact Number"
                            {...field}
                        />
                    )}
                />
            </FormItem> */}

            <FormItem
                label="Company Primary Contact Number"
                invalid={Boolean(errors.alternate_contact_country_code) || Boolean(errors.alternate_contact_number)}
                errorMessage={
                    (errors.alternate_contact_country_code?.message as string) ||
                    (errors.alternate_contact_number?.message as string)
                }
            >
                <div className="flex items-center gap-2">
                    <Controller
                        name="primary_contact_country_code"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="+1"
                                className="w-20" // Keep it narrow
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="primary_contact_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="tel"
                                autoComplete="off"
                                placeholder="Primary Number"
                                className="flex-grow"
                                {...field}
                            />
                        )}
                    />
                </div>
            </FormItem>

            {/* Alternate Contact Number - Combined Field
                This will now naturally try to fit within one of the 3 columns.
                The inner flexbox will manage the country code and number input.
            */}
            <FormItem
                label="Alternate Contact Number"
                invalid={Boolean(errors.alternate_contact_country_code) || Boolean(errors.alternate_contact_number)}
                errorMessage={
                    (errors.alternate_contact_country_code?.message as string) ||
                    (errors.alternate_contact_number?.message as string)
                }
            >
                <div className="flex items-center gap-2">
                    <Controller
                        name="alternate_contact_country_code"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="+1"
                                className="w-20" // Keep it narrow
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="alternate_contact_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="tel"
                                autoComplete="off"
                                placeholder="Alternate Number"
                                className="flex-grow"
                                {...field}
                            />
                        )}
                    />
                </div>
            </FormItem>
            
            {/* Company Primary E-mail ID */}
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

            {/* Alternate E-mail ID */}
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
                    name="ownership_type"
                    control={control}
                    rules={{ required: 'Ownership type is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select Ownership Type"
                            options={ownershipTypeOptions}
                            value={ownershipTypeOptions.find(option => option.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                            {...field}
                        />
                    )}
                />
            </FormItem>

            {/* Owner/Director/Proprietor Name
                If this field is long, it might cause wrapping issues on md with 3 cols.
                You might need to make it md:col-span-2 or md:col-span-3 if it needs more width.
            */}
            <FormItem
                label="Owner/Director/Proprietor Name"
                invalid={Boolean(errors.owner_director_proprietor_name)}
                errorMessage={errors.owner_director_proprietor_name?.message as string}
            >
                <Controller
                    name="owner_director_proprietor_name"
                    control={control}
                    rules={{ required: 'Name is required' }}
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

            {/* Company Address
                This will likely need to span multiple columns in a 3-column layout.
            */}
            <FormItem
                label="Company Address"
                invalid={Boolean(errors.company_address)}
                errorMessage={errors.company_address?.message as string}
                className="md:col-span-2" // Make address take full width in 3-col layout
            >
                <Controller
                    name="company_address"
                    control={control}
                    rules={{ required: 'Address is required' }}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Company Address"
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
                    name="continent_name"
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

            {/* Country as Select */}
            <FormItem
                label="Country"
                invalid={Boolean(errors.country)}
                errorMessage={errors.country?.message as string}
            >
                <Controller
                    name="country"
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
                invalid={Boolean(errors.state)}
                errorMessage={errors.state?.message as string}
            >
                <Controller
                    name="state"
                    control={control}
                    rules={{ required: 'State is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select State"
                            options={stateOptions}
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
                className='col-span-2'
            >
                <Controller
                    name="city"
                    control={control}
                    rules={{ required: 'City is required' }}
                    render={({ field }) => (
                        <Select
                            placeholder="Select City"
                            options={cityOptions}
                            value={cityOptions.find(option => option.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                            {...field}
                        />
                    )}
                />
            </FormItem>


            {/* ZIP / Postal Code */}
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


        </div>
    </Card>
    )
}

export default PrimaryDetailSection