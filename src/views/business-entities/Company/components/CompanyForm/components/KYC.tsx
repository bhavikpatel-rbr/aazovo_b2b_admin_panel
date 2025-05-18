import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import {CompanyFormFields} from '../types'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'

type KYCDetailSectionProps = FormSectionBaseProps


const KYCDetailSection = ({
    control,
    errors,
}: KYCDetailSectionProps) => {

    return (
<Card id="kycDocuments">
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
            <>
                <div key={doc.name} className="mb-6">
                    <FormItem label={doc.label}>
                        <Controller
                            name={doc.name as keyof CompanyFormFields}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    onChange={(e) => {
                                        const target = e.target as HTMLInputElement;
                                        field.onChange(target.files?.[0]?.name || '');
                                    }}
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
                                    <Checkbox
                                    defaultChecked={!!field.value}
                                    onChange={(checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => field.onChange(checked)}
                                    >
                                        Add Remark
                                    </Checkbox>
                                )}
                            />
                        </label>

                        <Controller
                            name={remarkField}
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input textArea
                                className="form-textarea w-full"
                                placeholder={`Remark for ${doc.label}`}
                                value={value as string}
                                onChange={onChange}
                                onBlur={onBlur}
                                // disabled={!control._formValues[checkboxField]}
                                />
                            )}
                            />
                    </div>
                </div>
            </>
        )
    })}
    {/* Footer with Save and Cancel buttons */}
    <div className="flex justify-end gap-3 mt-6 border-t pt-4">
        <Button type="button" className="px-4 py-2 rounded">Cancel</Button>
        <Button type="submit" className="px-4 py-2 rounded" variant="solid">Save</Button>
    </div>
</Card>


    )
}

export default KYCDetailSection
