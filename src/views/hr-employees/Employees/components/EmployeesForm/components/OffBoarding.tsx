import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Radio from '@/components/ui/Radio'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import { OffBoardingFormValues } from './types'

// ... (Your offBoardingConfig array remains the same)

const OffBoardingSection = ({ control, errors }: FormSectionBaseProps) => {
    // ... (Your offBoardingConfig array remains here) ...
    // Using a simplified version for brevity
    const config = [
        { key: 'exit_interview_conducted', label: 'Exit Interview Conducted?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'exit_interview_remark', remarksLabel: 'Remarks' },
        { key: 'resignation_letter_received', label: 'Resignation Letter Received?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'resignation_letter_remark', remarksLabel: 'Remarks' },
        { key: 'company_assets_returned', label: 'Company Assets Returned?', options: [{value: 'all', label: 'All'}, {value: 'partial', label: 'Partial'}, {value: 'none', label: 'None'}], remarksKey: 'assets_returned_remarks', remarksLabel: 'Remarks' },
        { key: 'full_and_final_settlement', label: 'FNF Processed?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'fnf_remarks', remarksLabel: 'Remarks' },
        { key: 'notice_period_status', label: 'Notice Period Status', options: [{value: 'served', label: 'Served'}, {value: 'waived', label: 'Waived'}], remarksKey: 'notice_period_remarks', remarksLabel: 'Remarks' },
    ]

    return (
        <Card id="offBoarding">
            <h4 className="mb-6">Off Boarding Process</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                {config.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-4">
                        <FormItem
                            label={item.label}
                            invalid={!!errors.offBoarding?.[item.key]}
                            errorMessage={errors.offBoarding?.[item.key]?.message}
                        >
                            <Controller
                                name={`offBoarding.${item.key}`}
                                control={control}
                                rules={{ required: `${item.label.replace('?','')} is required` }}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                                        {item.options.map((opt) => (
                                            <Radio key={opt.value} name={field.name} value={opt.value} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)}>
                                                {opt.label}
                                            </Radio>
                                        ))}
                                    </div>
                                )}
                            />
                        </FormItem>
                        <FormItem label={item.remarksLabel} invalid={!!errors.offBoarding?.[item.remarksKey]} errorMessage={errors.offBoarding?.[item.remarksKey]?.message}>
                            <Controller
                                name={`offBoarding.${item.remarksKey}`}
                                control={control}
                                render={({ field }) => <Input textArea placeholder="Enter remarks..." {...field} />}
                            />
                        </FormItem>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export default OffBoardingSection