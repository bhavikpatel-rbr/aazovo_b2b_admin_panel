import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui'
import type { FormSectionBaseProps } from '../types'

interface TrainingFormValues {
    inductionDateCompletion?: Date | string | null
    inductionRemarks?: string
    departmentTrainingDateCompletion?: Date | string | null
    departmentTrainingRemarks?: string
}

interface TimeAttendanceProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        training?: {
            [K in keyof TrainingFormValues]?: { message?: string }
        }
    }
}

const TimeAttendance = ({ control, errors }: TimeAttendanceProps) => {
    const [inTime, setInTime] = useState<string | null>(null)
    const [outTime, setOutTime] = useState<string | null>(null)

    const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const handleInClick = () => {
        const now = new Date()
        setInTime(formatTime(now))
    }

    const handleOutClick = () => {
        const now = new Date()
        setOutTime(formatTime(now))
    }

    return (
        <Card id="timeAttendence">
            <h4 className="mb-6">Time Attendance</h4>
            <div className="flex gap-4">
                <Button
                    type="button"
                    onClick={handleInClick}
                    variant="outline"
                    className="px-6 py-2"
                >
                    {inTime ? `In: ${inTime}` : 'In'}
                </Button>
                <Button
                    type="button"
                    onClick={handleOutClick}
                    variant="outline"
                    className="px-6 py-2"
                >
                    {outTime ? `Out: ${outTime}` : 'Out'}
                </Button>
            </div>
        </Card>
    )
}

export default TimeAttendance
