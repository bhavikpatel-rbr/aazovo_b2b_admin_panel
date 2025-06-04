import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
// import Button from '@/components/ui/Button' // Not used in this version, but can be added if needed
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct for your project structure
import DatePicker from "@/components/ui/DatePicker";

// --- Mock Options Data (Replace with real data or fetch from API as needed) ---
const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
]

const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
]

const nationalityOptions = [
    { value: 'us', label: 'American' },
    { value: 'ca', label: 'Canadian' },
    { value: 'gb', label: 'British' },
    { value: 'in', label: 'Indian' },
    // ... other nationalities
]

const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
]
// --- End Mock Options Data ---

interface PersonalInformationFormValues {
    status?: string;
    dateOfBirth?: string;
    age?: number | string; // Age might be calculated or entered
    gender?: string;
    maritalStatus?: string;
    nationality?: string;
    bloodGroup?: string;
    permanentAddress?: string;
    localAddress?: string;
}

// Extend FormSectionBaseProps to include errors for personalInformation
interface PersonalInformationSectionProps extends FormSectionBaseProps {
    // It's good practice to type the specific part of the errors object
    errors: FormSectionBaseProps['errors'] & {
        personalInformation?: {
            [K in keyof PersonalInformationFormValues]?: { message?: string }
        }
    };
    // control: Control<any>; // Already in FormSectionBaseProps, but ensure it's compatible
}


const PersonalInformationSection = ({
    control,
    errors,
}: PersonalInformationSectionProps) => {
    return (
        <Card id="personalInformation">
            <h4 className="mb-6">Personal Information</h4>
            <div className="flex flex-col gap-6">
                <div className="md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-end">
                    {/* Status Select */}
                    <FormItem
                        className='col-span-6 lg:col-span-4'
                        label="Status"
                        invalid={Boolean(errors.personalInformation?.status)}
                        errorMessage={errors.personalInformation?.status?.message as string}
                    >
                        <Controller
                            name={`personalInformation.status`}
                            control={control}
                            rules={{ required: 'Status is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Status"
                                    options={statusOptions}
                                    value={statusOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Date of Birth */}
                    <FormItem
                        className='col-span-6 lg:col-span-4'
                        label="Date of Birth"
                        invalid={Boolean(errors.personalInformation?.dateOfBirth)}
                        errorMessage={errors.personalInformation?.dateOfBirth?.message as string}
                    >
                        <Controller
                            name={`personalInformation.dateOfBirth`}
                            control={control}
                            rules={{ required: 'Date of Birth is required' }}
                            render={({ field }) => (
                                <DatePicker
                                    labelFormat={{
                                    month: "MMMM",
                                    year: "YY",
                                    }}
                                    defaultValue={new Date()}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Age */}
                    <FormItem
                        className='col-span-4 lg:col-span-4'
                        label="Age"
                        invalid={Boolean(errors.personalInformation?.age)}
                        errorMessage={errors.personalInformation?.age?.message as string}
                    >
                        <Controller
                            name={`personalInformation.age`}
                            control={control}
                            // Add validation rules for age if needed (e.g., min, max, isNumber)
                            rules={{ 
                                required: 'Age is required',
                                pattern: {
                                    value: /^[0-9]+$/,
                                    message: "Age must be a number"
                                }
                            }}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    autoComplete="off"
                                    placeholder="Enter Age"
                                    {...field}
                                    // Consider adding min="0" if appropriate
                                />
                            )}
                        />
                    </FormItem>

                    {/* Gender Select */}
                    <FormItem
                        className='col-span-4 lg:col-span-3'
                        label="Gender"
                        invalid={Boolean(errors.personalInformation?.gender)}
                        errorMessage={errors.personalInformation?.gender?.message as string}
                    >
                        <Controller
                            name={`personalInformation.gender`}
                            control={control}
                            rules={{ required: 'Gender is required' }}
                            render={({ field }) => (
                                <Select
                                    className='text-nowrap'
                                    placeholder="Select Gender"
                                    options={genderOptions}
                                    value={genderOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Marital Status Select */}
                    <FormItem
                        className='col-span-4 lg:col-span-3'
                        label="Marital Status"
                        invalid={Boolean(errors.personalInformation?.maritalStatus)}
                        errorMessage={errors.personalInformation?.maritalStatus?.message as string}
                    >
                        <Controller
                            name={`personalInformation.maritalStatus`}
                            control={control}
                            rules={{ required: 'Marital Status is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Marital Status"
                                    className='text-nowrap'
                                    options={maritalStatusOptions}
                                    value={maritalStatusOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Nationality Select */}
                    <FormItem
                        className='col-span-6 lg:col-span-3'
                        label="Nationality"
                        invalid={Boolean(errors.personalInformation?.nationality)}
                        errorMessage={errors.personalInformation?.nationality?.message as string}
                    >
                        <Controller
                            name={`personalInformation.nationality`}
                            control={control}
                            rules={{ required: 'Nationality is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Nationality"
                                    className='text-nowrap'
                                    options={nationalityOptions} // Can be a long list, consider search/async select
                                    value={nationalityOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Blood Group Select */}
                    <FormItem
                        className='col-span-6 lg:col-span-3'
                        label="Blood Group"
                        invalid={Boolean(errors.personalInformation?.bloodGroup)}
                        errorMessage={errors.personalInformation?.bloodGroup?.message as string}
                    >
                        <Controller
                            name={`personalInformation.bloodGroup`}
                            control={control}
                            // Not always required, adjust as needed
                            // rules={{ required: 'Blood Group is required' }} 
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Blood Group"
                                    options={bloodGroupOptions}
                                    className='text-nowrap'
                                    value={bloodGroupOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Permanent Address */}
                    <FormItem
                        label="Permanent Address"
                        invalid={Boolean(errors.personalInformation?.permanentAddress)}
                        errorMessage={errors.personalInformation?.permanentAddress?.message as string}
                        className="col-span-12 lg:col-span-6" // Adjust span if needed
                    >
                        <Controller
                            name={`personalInformation.permanentAddress`}
                            control={control}
                            rules={{ required: 'Permanent Address is required' }}
                            render={({ field }) => (
                                <Input
                                    textArea // Assuming your Input component supports a textArea prop for multiline
                                    // type="text" // or remove type if textArea implies it
                                    autoComplete="off"
                                    placeholder="Enter Permanent Address"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    
                    {/* Local Address */}
                    <FormItem
                        label="Local Address"
                        invalid={Boolean(errors.personalInformation?.localAddress)}
                        errorMessage={errors.personalInformation?.localAddress?.message as string}
                        className="col-span-12 lg:col-span-6" // Adjust span if needed
                    >
                        <Controller
                            name={`personalInformation.localAddress`}
                            control={control}
                            // Not always required, adjust as needed
                            // rules={{ required: 'Local Address is required' }}
                            render={({ field }) => (
                                <Input
                                    textArea // Assuming your Input component supports a textArea prop for multiline
                                    // type="text"
                                    autoComplete="off"
                                    placeholder="Enter Local Address (if different)"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </div>
            {/* Add any relevant buttons here if needed, e.g., Save, Next */}
            {/* 
            <div className='flex gap-2 justify-end items-center mt-6'>
                <Button type='submit' variant="solid">Save Personal Info</Button>
            </div>
            */}
        </Card>
    )
}

export default PersonalInformationSection