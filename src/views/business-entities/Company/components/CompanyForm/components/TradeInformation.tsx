import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type TradeDetailSectionProps = FormSectionBaseProps

const TradeDetailSection = ({
    control,
    errors,
}: TradeDetailSectionProps) => {

    return (
        <Card id="tradeInformation" className="">
            <h5 className="mb-6">Trade Information</h5>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label="GST Number"
                    invalid={Boolean(errors.gst_number)}
                    errorMessage={errors.gst_number?.message}
                >
                    <Controller
                        name="gst_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="GST Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="PAN Number"
                    invalid={Boolean(errors.pan_number)}
                    errorMessage={errors.pan_number?.message}
                >
                    <Controller
                        name="pan_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="PAN Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="TRN Number"
                    invalid={Boolean(errors.trn_number)}
                    errorMessage={errors.trn_number?.message}
                >
                    <Controller
                        name="trn_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="TRN Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="TAN Number"
                    invalid={Boolean(errors.tan_number)}
                    errorMessage={errors.tan_number?.message}
                >
                    <Controller
                        name="tan_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="TAN Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default TradeDetailSection
