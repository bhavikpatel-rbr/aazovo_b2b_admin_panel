import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
// import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps, CompanyFormSchema } from '../types'
import NumericInput from '@/components/shared/NumericInput'
import { Button } from '@/components/ui'
import { TbPlus } from 'react-icons/tb'
type CompanyDetailsProps = FormSectionBaseProps


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


// --- Mock Options Data (Keep as is or replace) ---
const ownershipTypeOptions = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_limited', label: 'Private Limited Company' },
    // ... other options
];
const cityOptions = [ { value: 'Mumbai', label: 'Mumbai' }, /* ... */ ];
const continentOptions = [ { value: 'AS', label: 'Asia' }, /* ... */ ];
// --- End Mock Options Data ---


const CompanyDetails = ({
    control,
    errors,
}: CompanyDetailsProps) => {

    return (
    <Card id="companyDetails">
        <h4 className="mb-4">Primary Information</h4>
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
            <FormItem
                label="Company Primary Contact Number"
                invalid={Boolean(errors.company_primary_contact_number)}
                errorMessage={errors.company_primary_contact_number?.message as string}
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
                className='md:col-span-3'
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
                className="md:col-span-3" // Make address take full width in 3-col layout
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
                            textArea
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

        <hr />
        <h4 className="mb-4 mt-4">Trade Information</h4>
        <div className="grid md:grid-cols-2 gap-3">
            <FormItem
                label="GST Number"
                invalid={Boolean(errors.gst_number)}
                errorMessage={errors.gst_number?.message}
            >
                <Controller
                    name="gst_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="GST Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="PAN Number"
                invalid={Boolean(errors.pan_number)}
                errorMessage={errors.pan_number?.message}
            >
                <Controller
                    name="pan_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="PAN Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="TRN Number"
                invalid={Boolean(errors.trn_number)}
                errorMessage={errors.trn_number?.message}
            >
                <Controller
                    name="trn_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="TRN Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="TAN Number"
                invalid={Boolean(errors.tan_number)}
                errorMessage={errors.tan_number?.message}
            >
                <Controller
                    name="tan_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="TAN Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>
        </div>

        <hr />
        <h4 className="mb-4 mt-4">Company Information</h4>
        <div className="grid md:grid-cols-3 gap-3">
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

        <hr />
        <h4 className="mb-4 mt-4">Certificates</h4>
        <div className="grid md:grid-cols-7 gap-3">
            <FormItem
                label="Certificate Name"
                invalid={Boolean(errors.certificate_name)}
                errorMessage={errors.certificate_name?.message}
                className='col-span-3'
            >
                <Controller
                    name="certificate_name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="e.g., ISO 9001"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Upload Certificate"
                invalid={Boolean(errors.upload_certificate)}
                errorMessage={errors.upload_certificate?.message}
                className='col-span-3'
            >
                <Controller
                    name="upload_certificate"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="file"
                            autoComplete="off"
                            placeholder="https://example.com/certificate.pdf"
                            {...field}
                        />
                    )}
                />
            </FormItem>
            <div className='flex justify-center items-center'>
                <Button type='button' icon={<TbPlus/>}>Add More</Button>
            </div>
        </div>

        <hr />
            <h4 className="mb-4 mt-4">Office Information</h4>
            <div className="grid md:grid-cols-2 gap-3">
                <FormItem
                    // label="Head Office" // Or Branch Name
                    label="Office Type" // Or Branch Name
                    invalid={Boolean(errors.head_office)}
                    errorMessage={errors.head_office?.message as string}
                >
                    <Controller
                        name="head_office" // Or branch_name
                        control={control}
                        rules={{ required: 'Office/Branch name is required' }}
                        render={({ field }) => (
                            // <Input
                            //     type="text"
                            //     autoComplete="off"
                            //     placeholder="e.g., Main Office, Mumbai Branch"
                            //     {...field}
                            // />
                            <Select 
                                placeholder="Select Office Type"
                                options={[
                                    { label: "Head Office", value: "Head Office" },
                                    { label: "Branch", value: "Branch" },
                                ]}
                            />
                        )}
                    />
                </FormItem>
                    
                {/* Office Name */}
                <FormItem
                    label="Office Name"
                    invalid={Boolean(errors.branches)}
                    errorMessage={errors.branches?.message as string}
                >
                    <Controller
                        name="branches"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="e.g. XYZ Pvt. Ltd."
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
                                textArea
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
            <div className='flex justify-end'>
                <Button type='button' icon={<TbPlus/>}>Add More</Button>
            </div>
    </Card>
    )
}

export default CompanyDetails