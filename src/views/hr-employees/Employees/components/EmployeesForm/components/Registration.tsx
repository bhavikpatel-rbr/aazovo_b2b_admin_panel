import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import DatePicker from "@/components/ui/DatePicker";

const Registration = ({
    control,
    errors,
}: FormSectionBaseProps) => {
    return (
        <Card id="registration">
            <h4 className="mb-6">Registration</h4>
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {/* Full Name */}
            <FormItem
                label={<div>Full Name<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.full_name)}
                errorMessage={errors.full_name?.message as string}
                className="col-span-1"
            >
                <Controller
                name="full_name"
                control={control}
                rules={{ required: 'Full Name is required' }}
                render={({ field }) => (
                    <Input
                    type="text"
                    placeholder="Enter full name"
                    {...field}
                    />
                )}
                />
            </FormItem>

            {/* Date of Joining */}
            <FormItem
                label={<div>Date of Joining<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.date_of_joining)}
                errorMessage={errors.date_of_joining?.message as string}
                className="col-span-1"
            >
                <Controller
                name="date_of_joining"
                control={control}
                rules={{ required: 'Date of Joining is required' }}
                render={() => (
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

            {/* Mobile Number */}
            <FormItem
                label={<div>Mobile Number<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.mobile_number)}
                errorMessage={errors.mobile_number?.message as string}
                className="col-span-1"
            >
                <Controller
                name="mobile_number"
                control={control}
                rules={{ required: 'Mobile Number is required' }}
                render={({ field }) => (
                    <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    {...field}
                    />
                )}
                />
            </FormItem>

            {/* Email */}
            <FormItem
                label={<div>Email<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.email)}
                errorMessage={errors.email?.message as string}
                className="col-span-1"
            >
                <Controller
                name="email"
                control={control}
                rules={{
                    required: 'Email is required',
                    pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                    },
                }}
                render={({ field }) => (
                    <Input
                    type="email"
                    placeholder="Enter email"
                    {...field}
                    />
                )}
                />
            </FormItem>

            {/* Experience */}
            <FormItem
                label={<div>Experience (Years)<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.experience)}
                errorMessage={errors.experience?.message as string}
                className="col-span-1"
            >
                <Controller
                name="experience"
                control={control}
                rules={{ required: 'Experience is required' }}
                render={({ field }) => (
                    <Input
                    type="number"
                    min={0}
                    placeholder="Enter experience"
                    {...field}
                    />
                )}
                />
            </FormItem>

            {/* Password */}
            <FormItem
                label={<div>Password<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.password)}
                errorMessage={errors.password?.message as string}
                className="col-span-1"
            >
                <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                    <Input
                    type="password"
                    placeholder="Enter password"
                    {...field}
                    />
                )}
                />
            </FormItem>
            </div>
        </Card>
    );
};

export default Registration
