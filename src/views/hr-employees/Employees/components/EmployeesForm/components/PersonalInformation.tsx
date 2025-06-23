import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import DatePicker from "@/components/ui/DatePicker"

// Mock Data (replace with API data)
const statusOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]
const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]
const nationalityOptions = [{ value: 1, label: 'Indian' }, { value: 2, label: 'American' }]
const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'B+', label: 'B+' }, { value: 'O+', label: 'O+' }]
const maritalStatusOptions = [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }]

const PersonalInformationSection = ({ control, errors }: FormSectionBaseProps) => {
    return (
        <Card id="personalInformation">
            <h4 className="mb-6">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormItem label="Status *" invalid={!!errors.personalInformation?.status} errorMessage={errors.personalInformation?.status?.message}>
                    <Controller
                        name="personalInformation.status"
                        control={control}
                        rules={{ required: 'Status is required' }}
                        render={({ field }) => <Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />}
                    />
                </FormItem>
                <FormItem label="Date of Birth *" invalid={!!errors.personalInformation?.dateOfBirth} errorMessage={errors.personalInformation?.dateOfBirth?.message}>
                    <Controller
                        name="personalInformation.dateOfBirth"
                        control={control}
                        rules={{ required: 'Date of Birth is required' }}
                        render={({ field }) => <DatePicker placeholder="Select Date" value={field.value ? new Date(field.value) : null} onChange={(date) => field.onChange(date)} />}
                    />
                </FormItem>
                <FormItem label="Age *" invalid={!!errors.personalInformation?.age} errorMessage={errors.personalInformation?.age?.message}>
                    <Controller
                        name="personalInformation.age"
                        control={control}
                        rules={{ required: 'Age is required', pattern: { value: /^[0-9]+$/, message: "Age must be a number" } }}
                        render={({ field }) => <Input type="number" placeholder="Enter Age" {...field} />}
                    />
                </FormItem>
                <FormItem label="Gender *" invalid={!!errors.personalInformation?.gender} errorMessage={errors.personalInformation?.gender?.message}>
                    <Controller
                        name="personalInformation.gender"
                        control={control}
                        rules={{ required: 'Gender is required' }}
                        render={({ field }) => <Select placeholder="Select Gender" options={genderOptions} value={genderOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />}
                    />
                </FormItem>
                <FormItem label="Marital Status" invalid={!!errors.personalInformation?.maritalStatus} errorMessage={errors.personalInformation?.maritalStatus?.message}>
                    <Controller
                        name="personalInformation.maritalStatus"
                        control={control}
                        render={({ field }) => <Select placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />}
                    />
                </FormItem>
                <FormItem label="Nationality *" invalid={!!errors.personalInformation?.nationalityId} errorMessage={errors.personalInformation?.nationalityId?.message}>
                    <Controller
                        name="personalInformation.nationalityId"
                        control={control}
                        rules={{ required: 'Nationality is required' }}
                        render={({ field }) => <Select placeholder="Select Nationality" options={nationalityOptions} value={nationalityOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />}
                    />
                </FormItem>
                <FormItem label="Blood Group" invalid={!!errors.personalInformation?.bloodGroup} errorMessage={errors.personalInformation?.bloodGroup?.message}>
                    <Controller
                        name="personalInformation.bloodGroup"
                        control={control}
                        render={({ field }) => <Select placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />}
                    />
                </FormItem>
                <FormItem label="Permanent Address *" invalid={!!errors.personalInformation?.permanentAddress} errorMessage={errors.personalInformation?.permanentAddress?.message} className="md:col-span-2 lg:col-span-3">
                    <Controller
                        name="personalInformation.permanentAddress"
                        control={control}
                        rules={{ required: 'Permanent Address is required' }}
                        render={({ field }) => <Input textArea placeholder="Enter Permanent Address" {...field} />}
                    />
                </FormItem>
                <FormItem label="Local Address" invalid={!!errors.personalInformation?.localAddress} errorMessage={errors.personalInformation?.localAddress?.message} className="md:col-span-2 lg:col-span-3">
                    <Controller
                        name="personalInformation.localAddress"
                        control={control}
                        render={({ field }) => <Input textArea placeholder="Enter Local Address" {...field} />}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default PersonalInformationSection