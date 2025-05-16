import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type CerificateDetailSectionProps = FormSectionBaseProps

type CountryOption = {
    label: string
    dialCode: string
    value: string
}

const CerificateDetailSection = ({
    control,
    errors,
}: CerificateDetailSectionProps) => {
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
        <Card id="certificateAndLicenses">
            <h4 className="mb-6">Certificates</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label="Certificate Name"
                    invalid={Boolean(errors.certificate_name)}
                    errorMessage={errors.certificate_name?.message}
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
                    label="Upload Certificate (URL)"
                    invalid={Boolean(errors.upload_certificate)}
                    errorMessage={errors.upload_certificate?.message}
                >
                    <Controller
                        name="upload_certificate"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="url"
                                autoComplete="off"
                                placeholder="https://example.com/certificate.pdf"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default CerificateDetailSection
