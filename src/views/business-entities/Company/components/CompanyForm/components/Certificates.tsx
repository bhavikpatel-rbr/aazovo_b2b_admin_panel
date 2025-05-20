import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import { Button } from '@/components/ui'
import { TbPlus } from 'react-icons/tb'

type CerificateDetailSectionProps = FormSectionBaseProps


const CerificateDetailSection = ({
    control,
    errors,
}: CerificateDetailSectionProps) => {

    return (
        <Card id="certificateAndLicenses">
            <h5 className="mb-6">Certificates</h5>
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
            <Button icon={<TbPlus/>} type='button' className='relative float-right mb-4'> Add More</Button>
        </Card>
    )
}

export default CerificateDetailSection
