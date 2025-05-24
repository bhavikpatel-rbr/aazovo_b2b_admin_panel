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
interface TimeAttendanceProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        training?: { // Assuming form data is nested under 'training'
            [K in keyof TrainingFormValues]?: { message?: string }
        }
    };
}

const TimeAttendance = ({
    control,
    errors,
}: TimeAttendanceProps) => {
    return (
        <Card id="timeAttendence">
            <h4 className="mb-6">Time Attendence</h4>
        </Card>
    )
}

export default TimeAttendance