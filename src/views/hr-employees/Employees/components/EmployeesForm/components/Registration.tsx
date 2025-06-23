import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import DatePicker from "@/components/ui/DatePicker"

const RegistrationSection = ({ control, errors }: FormSectionBaseProps) => {
    return (
        <Card id="registration">
            <h4 className="mb-6">Registration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormItem
                    label={<div>Full Name<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.fullName}
                    errorMessage={errors.registration?.fullName?.message}
                >
                    <Controller
                        name="registration.fullName"
                        control={control}
                        rules={{ required: 'Full Name is required' }}
                        render={({ field }) => <Input placeholder="Enter full name" {...field} />}
                    />
                </FormItem>

                <FormItem
                    label={<div>Date of Joining<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.dateOfJoining}
                    errorMessage={errors.registration?.dateOfJoining?.message}
                >
                    <Controller
                        name="registration.dateOfJoining"
                        control={control}
                        rules={{ required: 'Date of Joining is required' }}
                        render={({ field }) => (
                            <DatePicker
                                placeholder="Select date"
                                value={field.value ? new Date(field.value) : null}
                                onChange={(date) => field.onChange(date)}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label={<div>Mobile Number<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.mobileNumber}
                    errorMessage={errors.registration?.mobileNumber?.message}
                >
                    <Controller
                        name="registration.mobileNumber"
                        control={control}
                        rules={{ required: 'Mobile Number is required' }}
                        render={({ field }) => <Input type="tel" placeholder="9876543210" {...field} />}
                    />
                </FormItem>

                <FormItem
                    label={<div>Email<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.email}
                    errorMessage={errors.registration?.email?.message}
                >
                    <Controller
                        name="registration.email"
                        control={control}
                        rules={{
                            required: 'Email is required',
                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                        }}
                        render={({ field }) => <Input type="email" placeholder="employee@company.com" {...field} />}
                    />
                </FormItem>

                <FormItem
                    label={<div>Experience<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.experience}
                    errorMessage={errors.registration?.experience?.message}
                >
                    <Controller
                        name="registration.experience"
                        control={control}
                        rules={{ required: 'Experience is required' }}
                        render={({ field }) => <Input placeholder="e.g., 3 years" {...field} />}
                    />
                </FormItem>

                <FormItem
                    label={<div>Password<span className="text-red-500"> * </span></div>}
                    invalid={!!errors.registration?.password}
                    errorMessage={errors.registration?.password?.message}
                >
                    <Controller
                        name="registration.password"
                        control={control}
                        rules={{ required: 'Password is required for new employees' }}
                        render={({ field }) => <Input type="password" placeholder="Enter password" {...field} />}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default RegistrationSection