import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct

// --- Mock Options Data (Replace with real data or fetch from API as needed) ---
const roleOptions = [
    { value: 'individual_contributor', label: 'Individual Contributor' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior_manager', label: 'Senior Manager' },
    { value: 'director', label: 'Director' },
    { value: 'vp', label: 'Vice President' },
    { value: 'c_level', label: 'C-Level Executive' },
]

const departmentOptions = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'design', label: 'Design' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'human_resources', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'customer_support', label: 'Customer Support' },
]

const designationOptions = [ // These can be very specific and numerous
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'senior_software_engineer', label: 'Senior Software Engineer' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'ux_designer', label: 'UX Designer' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'marketing_specialist', label: 'Marketing Specialist' },
    { value: 'hr_business_partner', label: 'HR Business Partner' },
    // Add more as needed
]

const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'in', label: 'India' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    // ... other countries
]

const categoryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    // ... other categories
]

const subCategoryOptions = [ // These would ideally be dependent on the selected category
    { value: 'software_dev', label: 'Software Development' }, // Tech
    { value: 'it_infra', label: 'IT Infrastructure' },       // Tech
    { value: 'pharmaceuticals', label: 'Pharmaceuticals' },   // Healthcare
    { value: 'medical_devices', label: 'Medical Devices' },   // Healthcare
    { value: 'banking', label: 'Banking' },                 // Finance
    // ... other sub-categories
]

const brandOptions = [ // These would be highly company-specific
    { value: 'internal_brand_a', label: 'Internal Brand A' },
    { value: 'internal_brand_b', label: 'Internal Brand B' },
    { value: 'client_brand_x', label: 'Client Brand X' },
    // ... other brands
]

const productOptions = [ // Also highly company-specific or market-specific
    { value: 'product_alpha', label: 'Product Alpha' },
    { value: 'service_beta', label: 'Service Beta' },
    { value: 'platform_gamma', label: 'Platform Gamma' },
    // ... other products/services
]

const reportingPersonnelOptions = [ // Example list of employees/managers
    { value: 'emp001', label: 'John Smith (Manager)' },
    { value: 'emp002', label: 'Alice Johnson (HR Head)' },
    { value: 'emp003', label: 'Bob Williams (Director)' },
    { value: 'emp004', label: 'Sarah Miller (Lead)' },
    // ... other personnel
]
// --- End Mock Options Data ---

interface RoleResponsibilityFormValues {
    role?: string;
    department?: string;
    designation?: string;
    country?: string;
    category?: string;
    subCategory?: string;
    brand?: string;
    product?: string;
    reportingHR?: string;
    reportingHead?: string;
}

// Extend FormSectionBaseProps to include errors for roleResponsibility
interface RoleResponsibilitySectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        roleResponsibility?: {
            [K in keyof RoleResponsibilityFormValues]?: { message?: string }
        }
    };
}

const RoleResponsibilitySection = ({
    control,
    errors,
}: RoleResponsibilitySectionProps) => {
    return (
        <Card id="roleResponsibility">
            <h4 className="mb-6">Role & Responsibility</h4>
            <div className="flex flex-col gap-6">
                {/* Using a 2 or 3 column layout for medium screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    {/* Role */}
                    <FormItem
                        label="Role"
                        invalid={Boolean(errors.roleResponsibility?.role)}
                        errorMessage={errors.roleResponsibility?.role?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.role`}
                            control={control}
                            rules={{ required: 'Role is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Role"
                                    options={roleOptions}
                                    value={roleOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Department */}
                    <FormItem
                        label="Department"
                        invalid={Boolean(errors.roleResponsibility?.department)}
                        errorMessage={errors.roleResponsibility?.department?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.department`}
                            control={control}
                            rules={{ required: 'Department is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Department"
                                    options={departmentOptions}
                                    value={departmentOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Designation */}
                    <FormItem
                        label="Designation"
                        invalid={Boolean(errors.roleResponsibility?.designation)}
                        errorMessage={errors.roleResponsibility?.designation?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.designation`}
                            control={control}
                            rules={{ required: 'Designation is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Designation"
                                    options={designationOptions}
                                    value={designationOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Country */}
                    <FormItem
                        label="Country (Operational)"
                        invalid={Boolean(errors.roleResponsibility?.country)}
                        errorMessage={errors.roleResponsibility?.country?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.country`}
                            control={control}
                            rules={{ required: 'Country is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Country"
                                    options={countryOptions}
                                    value={countryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Category */}
                    <FormItem
                        label="Category (Focus Area)"
                        invalid={Boolean(errors.roleResponsibility?.category)}
                        errorMessage={errors.roleResponsibility?.category?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.category`}
                            control={control}
                            // rules={{ required: 'Category is required' }} // Make optional if not always applicable
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Category"
                                    options={categoryOptions}
                                    value={categoryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Subcategory */}
                    <FormItem
                        label="Subcategory"
                        invalid={Boolean(errors.roleResponsibility?.subCategory)}
                        errorMessage={errors.roleResponsibility?.subCategory?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.subCategory`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Subcategory"
                                    options={subCategoryOptions} // Ideally, filter based on selected category
                                    value={subCategoryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Brand */}
                    <FormItem
                        label="Brand (Responsibility)"
                        invalid={Boolean(errors.roleResponsibility?.brand)}
                        errorMessage={errors.roleResponsibility?.brand?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.brand`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Brand"
                                    options={brandOptions}
                                    value={brandOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Product */}
                    <FormItem
                        label="Product/Service (Focus)"
                        invalid={Boolean(errors.roleResponsibility?.product)}
                        errorMessage={errors.roleResponsibility?.product?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.product`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Product/Service"
                                    options={productOptions}
                                    value={productOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Reporting HR */}
                    <FormItem
                        label="Reporting HR"
                        invalid={Boolean(errors.roleResponsibility?.reportingHR)}
                        errorMessage={errors.roleResponsibility?.reportingHR?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.reportingHR`}
                            control={control}
                            rules={{ required: 'Reporting HR is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Reporting HR"
                                    options={reportingPersonnelOptions} // Use a list of HR personnel
                                    value={reportingPersonnelOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Reporting Head */}
                    <FormItem
                        label="Reporting Head (Manager)"
                        invalid={Boolean(errors.roleResponsibility?.reportingHead)}
                        errorMessage={errors.roleResponsibility?.reportingHead?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.reportingHead`}
                            control={control}
                            rules={{ required: 'Reporting Head is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Reporting Head"
                                    options={reportingPersonnelOptions} // Use a list of managers/supervisors
                                    value={reportingPersonnelOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </div>
            {/* Add any relevant buttons here if needed */}
        </Card>
    )
}

export default RoleResponsibilitySection