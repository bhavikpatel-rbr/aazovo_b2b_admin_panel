import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Radio from '@/components/ui/Radio'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct

// Define the structure of the form values for this section
interface OffBoardingFormValues {
    exitInterviewStatus?: 'yes' | 'no';
    exitInterviewRemarks?: string;
    resignationLetterStatus?: 'yes' | 'no';
    resignationLetterRemarks?: string;
    assetsReturnedStatus?: 'all' | 'partial' | 'none';
    assetsReturnedRemarks?: string;
    fnfStatus?: 'yes' | 'no';
    fnfRemarks?: string;
    noticePeriodStatus?: 'served' | 'waived' | 'bought_out' | 'absconded';
    noticePeriodRemarks?: string;
}

// Extend FormSectionBaseProps to include errors for offBoarding
interface OffBoardingSectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        offBoarding?: { // Assuming form data is nested under 'offBoarding'
            [K in keyof OffBoardingFormValues]?: { message?: string }
        }
    };
}

interface OffBoardingItemConfig {
    key: keyof OffBoardingFormValues; // For the radio button value field name (e.g., 'exitInterviewStatus')
    label: string; // For the radio button group FormItem label
    options: Array<{ value: string; label: string }>;
    remarksKey: keyof OffBoardingFormValues; // For the remarks field name (e.g., 'exitInterviewRemarks')
    remarksLabel: string; // For the remarks FormItem label
    required?: boolean;
}

const offBoardingConfig: OffBoardingItemConfig[] = [
    {
        key: 'exitInterviewStatus',
        label: 'Exit Interview Conducted?',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
        ],
        remarksKey: 'exitInterviewRemarks',
        remarksLabel: 'Exit Interview Remarks',
        required: true,
    },
    {
        key: 'resignationLetterStatus',
        label: 'Resignation Letter Received?',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
        ],
        remarksKey: 'resignationLetterRemarks',
        remarksLabel: 'Resignation Letter Remarks',
        required: true,
    },
    {
        key: 'assetsReturnedStatus',
        label: 'Company Assets Returned?',
        options: [
            { value: 'all', label: 'All' },
            { value: 'partial', label: 'Partial' },
            { value: 'none', label: 'None' },
        ],
        remarksKey: 'assetsReturnedRemarks',
        remarksLabel: 'Assets Returned Remarks',
        required: true,
    },
    {
        key: 'fnfStatus',
        label: 'Full and Final Settlement (FNF) Processed?',
        options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
        ],
        remarksKey: 'fnfRemarks',
        remarksLabel: 'FNF Remarks',
        required: true,
    },
    {
        key: 'noticePeriodStatus',
        label: 'Notice Period Status',
        options: [
            { value: 'served', label: 'Served' },
            { value: 'waived', label: 'Waived' },
            { value: 'bought_out', label: 'Bought Out' },
            { value: 'absconded', label: 'Absconded' },
        ],
        remarksKey: 'noticePeriodRemarks',
        remarksLabel: 'Notice Period Remarks',
        required: true,
    },
];

const OffBoardingSection = ({
    control,
    errors,
}: OffBoardingSectionProps) => {
    return (
        <Card id="offBoarding">
            <h4 className="mb-6">Off Boarding Process</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                {offBoardingConfig.map((item) => (
                    <div key={item.key} className="flex flex-col gap-y-4">
                        {/* Radio Button Group */}
                        <FormItem
                            label={item.label}
                            invalid={Boolean(errors.offBoarding?.[item.key])}
                            errorMessage={errors.offBoarding?.[item.key]?.message as string}
                        >
                            <Controller
                                name={`offBoarding.${item.key}`}
                                control={control}
                                rules={{
                                    required: item.required
                                        ? `${item.label.replace('?', '')} is required`
                                        : false,
                                }}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1"> {/* pt-1 for alignment with label */}
                                        {item.options.map((opt) => (
                                            <Radio
                                                key={opt.value}
                                                name={field.name} // RHF's field name for grouping
                                                value={opt.value}
                                                checked={field.value === opt.value}
                                                onChange={() => field.onChange(opt.value)}
                                                onBlur={field.onBlur}
                                            >
                                                {opt.label}
                                            </Radio>
                                        ))}
                                    </div>
                                )}
                            />
                        </FormItem>

                        {/* Remarks Textarea */}
                        <FormItem
                            label={item.remarksLabel}
                            invalid={Boolean(errors.offBoarding?.[item.remarksKey])}
                            errorMessage={errors.offBoarding?.[item.remarksKey]?.message as string}
                        >
                            <Controller
                                name={`offBoarding.${item.remarksKey}`}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        textArea
                                        autoComplete="off"
                                        placeholder={`Enter ${item.remarksLabel.toLowerCase()}...`}
                                        rows={3} // Adjust rows as needed
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                ))}
            </div>
            {/* Add any relevant buttons here if needed */}
        </Card>
    )
}

export default OffBoardingSection