import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type BranchesDetailSectionProps = FormSectionBaseProps

const BranchesDetailSection = ({
    control,
    errors,
}: BranchesDetailSectionProps) => {

    return (
        <Card id="branches">
            <h4 className="mb-6">Branch / Head Office Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label="Head Office"
                    invalid={Boolean(errors.head_office)}
                    errorMessage={errors.head_office?.message}
                >
                    <Controller
                        name="head_office"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Head Office"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Location Country"
                    invalid={Boolean(errors.location_country)}
                    errorMessage={errors.location_country?.message}
                >
                    <Controller
                        name="location_country"
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
                    label="State"
                    invalid={Boolean(errors.branch_state)}
                    errorMessage={errors.branch_state?.message}
                >
                    <Controller
                        name="branch_state"
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
                    label="ZIP Code"
                    invalid={Boolean(errors.branch_zip_code)}
                    errorMessage={errors.branch_zip_code?.message}
                >
                    <Controller
                        name="branch_zip_code"
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
                    label="Address"
                    invalid={Boolean(errors.branch_address)}
                    errorMessage={errors.branch_address?.message}
                >
                    <Controller
                        name="branch_address"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Full Address"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="GST/REG Number"
                    invalid={Boolean(errors.branch_gst_reg_number)}
                    errorMessage={errors.branch_gst_reg_number?.message}
                >
                    <Controller
                        name="branch_gst_reg_number"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="GST or Registration Number"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>

    )
}

export default BranchesDetailSection
