import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import NumericInput from '@/components/shared/NumericInput'

type CompanyInformationDetailSectionProps = FormSectionBaseProps

const CompanyInformationDetailSection = ({
    control,
    errors,
}: CompanyInformationDetailSectionProps) => {

    return (
        <Card id="companyInformation">
            <h4 className="mb-6">Company Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label="Establishment Year"
                    invalid={Boolean(errors.company_establishment_year)}
                    errorMessage={errors.company_establishment_year?.message}
                >
                    <Controller
                        name="company_establishment_year"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
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
                    errorMessage={errors.no_of_employees?.message}
                >
                    <Controller
                        name="no_of_employees"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                placeholder="e.g., 100"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Company Website"
                    invalid={Boolean(errors.company_website)}
                    errorMessage={errors.company_website?.message}
                >
                    <Controller
                        name="company_website"
                        control={control}
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
                    errorMessage={errors.company_logo_brochure?.message}
                >
                    <Controller
                        name="company_logo_brochure"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Logo or brochure URL"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Primary Business Type"
                    invalid={Boolean(errors.primary_business_type)}
                    errorMessage={errors.primary_business_type?.message}
                >
                    <Controller
                        name="primary_business_type"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="e.g., Manufacturer"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Primary Business Category"
                    invalid={Boolean(errors.primary_business_category)}
                    errorMessage={errors.primary_business_category?.message}
                >
                    <Controller
                        name="primary_business_category"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="e.g., Auto Parts"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>

    )
}

export default CompanyInformationDetailSection
