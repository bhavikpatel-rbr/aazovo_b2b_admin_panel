import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

// --- Mock Options Data (Replace with real data as needed) ---
const memberOptions = [
    { value: '1', label: 'John Doe' },
    { value: '2', label: 'Jane Smith' },
    { value: '3', label: 'Alice Johnson' },
    // ... other members
]

const designationOptions = [
    { value: 'ceo', label: 'CEO' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
    // ... other designations
]
// --- End Mock Options Data ---

const MemberManagementSection = ({
    control,
    errors,
}: FormSectionBaseProps) => {
    return (
        <>
        <Card id="memberManagement">
            <h4 className="mb-6">Member Management</h4>
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    {/* Member Select */}
                    <FormItem
                        label="Member"
                        invalid={Boolean(errors.members?.[0]?.member)}
                        errorMessage={errors.members?.[0]?.member?.message as string}
                    >
                        <Controller
                            name={`members.0.member`}
                            control={control}
                            rules={{ required: 'Member is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Member"
                                    options={memberOptions}
                                    value={memberOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Designation Select */}
                    <FormItem
                        label="Designation"
                        invalid={Boolean(errors.members?.[0]?.designation)}
                        errorMessage={errors.members?.[0]?.designation?.message as string}
                    >
                        <Controller
                            name={`members.0.designation`}
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

                    {/* Person Name */}
                    <FormItem
                        label="Person Name"
                        invalid={Boolean(errors.members?.[0]?.person_name)}
                        errorMessage={errors.members?.[0]?.person_name?.message as string}
                    >
                        <Controller
                            name={`members.0.person_name`}
                            control={control}
                            rules={{ required: 'Person Name is required' }}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Person Name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Contact Number */}
                    <FormItem
                        label="Contact Number"
                        invalid={Boolean(errors.members?.[0]?.contact_number)}
                        errorMessage={errors.members?.[0]?.contact_number?.message as string}
                    >
                        <Controller
                            name={`members.0.contact_number`}
                            control={control}
                            rules={{ required: 'Contact Number is required' }}
                            render={({ field }) => (
                                <Input
                                    type="tel"
                                    autoComplete="off"
                                    placeholder="Contact Number"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </div>
        </Card>
        </>
    )
}

export default MemberManagementSection
