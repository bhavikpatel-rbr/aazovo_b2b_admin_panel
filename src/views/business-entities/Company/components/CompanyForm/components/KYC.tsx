import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import {CompanyFormFields} from '../types'
type KYCDetailSectionProps = FormSectionBaseProps

type CountryOption = {
    label: string
    dialCode: string
    value: string
}

const KYCDetailSection = ({
    control,
    errors,
}: KYCDetailSectionProps) => {
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
<Card id="documentUpload">
    <h4 className="mb-4">Document Upload</h4>

    {[
        { label: '206AB Declaration', name: 'declaration_206ab' },
        { label: '194Q Declaration', name: 'declaration_194q' },
        { label: 'Office Photo', name: 'office_photo' },
        { label: 'GST Certificate', name: 'gst_certificate' },
        { label: 'Authority Letter', name: 'authority_letter' },
        { label: 'Visiting Card', name: 'visiting_card' },
        { label: 'Cancel Cheque', name: 'cancel_cheque' },
        { label: 'Aadhar Card', name: 'aadhar_card' },
        { label: 'PAN Card', name: 'pan_card' },
        { label: 'Other Document', name: 'other_document' },
    ].map((doc) => {
        const remarkField = `${doc.name}_remark` as keyof CompanyFormFields
        const checkboxField = `${doc.name}_remark_enabled` as keyof CompanyFormFields

        return (
            <div key={doc.name} className="mb-6">
                <FormItem label={doc.label}>
                    <Controller
                        name={doc.name as keyof CompanyFormFields}
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="file"
                                // onChange={(e) =>
                                //     field.onChange(e.target.files?.[0]?.name || '')
                                // }
                            />
                        )}
                    />
                </FormItem>

                <div className="mt-2">
                    <label className="flex items-center gap-2 mb-1">
                        <Controller
                            name={checkboxField}
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="checkbox"
                                    // checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            )}
                        />
                        Add Remark
                    </label>

                    <Controller
                        name={remarkField}
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <textarea
                            className="form-textarea w-full"
                            placeholder={`Remark for ${doc.label}`}
                            rows={2}
                            value={value as string}
                            onChange={onChange}
                            onBlur={onBlur}
                            disabled={!control._formValues[checkboxField]}
                            />
                        )}
                        />
                </div>
            </div>
        )
    })}
</Card>


    )
}

export default KYCDetailSection
