import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct
import DatePicker from '@/components/ui/DatePicker' // Assuming DatePicker component path

// Define the structure of the form values for this section
interface TrainingFormValues {
    inductionDateCompletion?: Date | string | null; // Date object or string from DatePicker
    inductionRemarks?: string;
    departmentTrainingDateCompletion?: Date | string | null;
    departmentTrainingRemarks?: string;
}

// Extend FormSectionBaseProps to include errors for training
interface TrainingSectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        training?: { // Assuming form data is nested under 'training'
            [K in keyof TrainingFormValues]?: { message?: string }
        }
    };
}

const TrainingSection = ({
    control,
    errors,
}: TrainingSectionProps) => {
    return (
        <Card id="trainingInformation">
            <h4 className="mb-6">Training Information</h4>
            <div className="flex flex-col gap-8"> {/* Increased gap between sections */}

                {/* Induction Training Section */}
                <div>
                    <h5 className="mb-4 text-base font-semibold">Induction Training</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Induction Training (Date of Completion) */}
                        <FormItem
                            label="Date of Completion"
                            invalid={Boolean(errors.training?.inductionDateCompletion)}
                            errorMessage={errors.training?.inductionDateCompletion?.message as string}
                        >
                            <Controller
                                name={`training.inductionDateCompletion`}
                                control={control}
                                // rules={{ required: 'Date of completion is required' }} // Make optional if needed
                                render={({ field }) => (
                                    <DatePicker
                                        placeholder="Select Date"
                                        value={field.value ? new Date(field.value) : null}
                                        onChange={(date) => field.onChange(date)}
                                        // {...field} // Spreading field might override value/onChange in some DatePicker impl.
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Remarks (for Induction Training) */}
                        <FormItem
                            label="Remarks"
                            invalid={Boolean(errors.training?.inductionRemarks)}
                            errorMessage={errors.training?.inductionRemarks?.message as string}
                            className="md:col-span-1" // Keep remarks next to its date
                        >
                            <Controller
                                name={`training.inductionRemarks`}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        textArea
                                        autoComplete="off"
                                        placeholder="Enter remarks for induction training"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                </div>

                {/* Department Specific Training Section */}
                <div>
                    <h5 className="mb-4 text-base font-semibold">Department Specific Training</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Department Specific Training (Date of Completion) */}
                        <FormItem
                            label="Date of Completion"
                            invalid={Boolean(errors.training?.departmentTrainingDateCompletion)}
                            errorMessage={errors.training?.departmentTrainingDateCompletion?.message as string}
                        >
                            <Controller
                                name={`training.departmentTrainingDateCompletion`}
                                control={control}
                                // rules={{ required: 'Date of completion is required' }}
                                render={({ field }) => (
                                    <DatePicker
                                        placeholder="Select Date"
                                        value={field.value ? new Date(field.value) : null}
                                        onChange={(date) => field.onChange(date)}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Remarks (for Department Specific Training) */}
                        <FormItem
                            label="Remarks"
                            invalid={Boolean(errors.training?.departmentTrainingRemarks)}
                            errorMessage={errors.training?.departmentTrainingRemarks?.message as string}
                            className="md:col-span-1"
                        >
                            <Controller
                                name={`training.departmentTrainingRemarks`}
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        textArea
                                        autoComplete="off"
                                        placeholder="Enter remarks for department specific training"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                </div>
            </div>
            {/* Add any relevant buttons here if needed, e.g., Save Training Info */}
            {/*
            <div className='flex justify-end items-center mt-6'>
                <Button type='submit' variant="solid">Save Training Data</Button>
            </div>
            */}
        </Card>
    )
}

export default TrainingSection