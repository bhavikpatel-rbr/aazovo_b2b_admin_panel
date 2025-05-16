import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type PrimaryDetailSectionProps = FormSectionBaseProps

type CountryOption = {
    label: string
    dialCode: string
    value: string
}


const PrimaryDetailSection = ({
    control,
    errors,
}: PrimaryDetailSectionProps) => {
    const dialCodeList = useMemo(() => {
        const newCountryList: Array<CountryOption> = JSON.parse(
            JSON.stringify(countryList),
        )

        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    return (
    <Card id="companyDetails">
        <h4 className="mb-6">Primary Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
            <FormItem
                label="Company Name"
                invalid={Boolean(errors.company_name)}
                errorMessage={errors.company_name?.message}
            >
                <Controller
                    name="company_name"
                    control={control}
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
                errorMessage={errors.company_primary_contact_number?.message}
            >
                <Controller
                    name="company_primary_contact_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Primary Contact Number"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Alternate Contact Number"
                invalid={Boolean(errors.alternate_contact_number)}
                errorMessage={errors.alternate_contact_number?.message}
            >
                <Controller
                    name="alternate_contact_number"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
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
                errorMessage={errors.company_primary_email_id?.message}
            >
                <Controller
                    name="company_primary_email_id"
                    control={control}
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
                errorMessage={errors.alternate_email_id?.message}
            >
                <Controller
                    name="alternate_email_id"
                    control={control}
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

            <FormItem
                label="Ownership Type"
                invalid={Boolean(errors.ownership_type)}
                errorMessage={errors.ownership_type?.message}
            >
                <Controller
                    name="ownership_type"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Ownership Type"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Owner/Director/Proprietor Name"
                invalid={Boolean(errors.owner_director_proprietor_name)}
                errorMessage={errors.owner_director_proprietor_name?.message}
            >
                <Controller
                    name="owner_director_proprietor_name"
                    control={control}
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
                errorMessage={errors.company_address?.message}
            >
                <Controller
                    name="company_address"
                    control={control}
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

            <FormItem
                label="City"
                invalid={Boolean(errors.city)}
                errorMessage={errors.city?.message}
            >
                <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="City"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="State"
                invalid={Boolean(errors.state)}
                errorMessage={errors.state?.message}
            >
                <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="State"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="ZIP / Postal Code"
                invalid={Boolean(errors.zip_postal_code)}
                errorMessage={errors.zip_postal_code?.message}
            >
                <Controller
                    name="zip_postal_code"
                    control={control}
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
                label="Country"
                invalid={Boolean(errors.country)}
                errorMessage={errors.country?.message}
            >
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Country"
                            {...field}
                        />
                    )}
                />
            </FormItem>

            <FormItem
                label="Continent Name"
                invalid={Boolean(errors.continent_name)}
                errorMessage={errors.continent_name?.message}
            >
                <Controller
                    name="continent_name"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            autoComplete="off"
                            placeholder="Continent Name"
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
