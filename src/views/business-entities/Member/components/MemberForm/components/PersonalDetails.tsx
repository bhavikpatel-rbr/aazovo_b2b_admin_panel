import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'

type PersonalDetailSectionProps = FormSectionBaseProps
const PersonalDetails = ({
  control,
  errors,
}: PersonalDetailSectionProps) => {

  // Example options, replace with your actual data sources
  const cityOptions = [
    { label: 'New York', value: 'new_york' },
    { label: 'London', value: 'london' },
    { label: 'Tokyo', value: 'tokyo' },
  ]
  const stateOptions = [
    { label: 'New York', value: 'ny' },
    { label: 'California', value: 'ca' },
    { label: 'Texas', value: 'tx' },
  ]
  const countryOptions = [
    { label: 'United States', value: 'us' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'Japan', value: 'jp' },
  ]
  const continentOptions = [
    { label: 'North America', value: 'north_america' },
    { label: 'Europe', value: 'europe' },
    { label: 'Asia', value: 'asia' },
  ]

  return (
    <Card id="personalDetails">
      <h4 className="mb-6">Personal Details</h4>
      <div className="grid md:grid-cols-3 gap-4">

        {/* Status Dropdown */}
        <FormItem
          label="Status"
          invalid={Boolean(errors.status)}
          errorMessage={errors.status?.message}
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                size="sm"
                className="mb-4"
                placeholder="Please Select"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Pending', value: 'pending' },
                ]}
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Full Name */}
        <FormItem
          label="Full Name"
          invalid={Boolean(errors.full_name)}
          errorMessage={errors.full_name?.message}
        >
          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Member’s full name"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Mobile Number */}
        <FormItem
          label="Mobile Number"
          invalid={Boolean(errors.mobile_number)}
          errorMessage={errors.mobile_number?.message}
        >
          <Controller
            name="mobile_number"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Primary contact number"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Email */}
        <FormItem
          label="Email"
          invalid={Boolean(errors.email)}
          errorMessage={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="off"
                placeholder="Primary email address"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Company Name (Temp) */}
        <FormItem
          label="Company Name (Temp)"
          invalid={Boolean(errors.company_name_temp)}
          errorMessage={errors.company_name_temp?.message}
        >
          <Controller
            name="company_name_temp"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Temporary input"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* City */}
        <FormItem
          label="City"
          invalid={Boolean(errors.city)}
          errorMessage={errors.city?.message}
        >
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select
                size="sm"
                placeholder="Select City"
                options={cityOptions}
                {...field}
              />
            )}
          />
        </FormItem>

        {/* State */}
        <FormItem
          label="State"
          invalid={Boolean(errors.state)}
          errorMessage={errors.state?.message}
        >
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select
                size="sm"
                placeholder="Select State"
                options={stateOptions}
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Country */}
        <FormItem
          label="Country"
          invalid={Boolean(errors.country)}
          errorMessage={errors.country?.message}
        >
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                size="sm"
                placeholder="Select Country"
                options={countryOptions}
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Continent */}
        <FormItem
          label="Continent"
          invalid={Boolean(errors.continent)}
          errorMessage={errors.continent?.message}
        >
          <Controller
            name="continent"
            control={control}
            render={({ field }) => (
              <Select
                size="sm"
                placeholder="Select Continent"
                options={continentOptions}
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Pincode */}
        <FormItem
          label="Pincode"
          invalid={Boolean(errors.pincode)}
          errorMessage={errors.pincode?.message}
        >
          <Controller
            name="pincode"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Enter pincode"
                {...field}
              />
            )}
          />
        </FormItem>

      </div>
    </Card>
  )
}

export default PersonalDetails;
