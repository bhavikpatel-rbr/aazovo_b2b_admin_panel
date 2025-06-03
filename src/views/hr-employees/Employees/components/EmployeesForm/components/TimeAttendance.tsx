import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button, Input, Table } from '@/components/ui'
import type { FormSectionBaseProps } from '../types'
import Tr from '@/components/ui/Table/Tr'
import Td from '@/components/ui/Table/Td'
import TBody from '@/components/ui/Table/TBody'

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
                <div className='flex flex-col gap-1'>
                    <Button
                        type="button"
                        onClick={handleInClick}
                        variant="outline"
                        className="px-6 py-2"
                    >
                        {inTime ? `In: ${inTime}` : 'In'}
                    </Button>
                    <Input type="time" className=''/>
                </div>
                <div className='flex flex-col gap-1'>
                    <Button
                        type="button"
                        onClick={handleOutClick}
                        variant="outline"
                        className="px-6 py-2"
                    >
                        {outTime ? `Out: ${outTime}` : 'Out'}
                    </Button>
                    <Input type="time" className=''/>
                </div>
            </div>
            {/* <Table className='mt-4'>
                <TBody>
                    <Tr>
                        <Td>12/04/2025</Td>
                        <Td>9:59</Td>
                        <Td>7:02</Td>
                    </Tr>
                    <Tr>
                        <Td>11/04/2025</Td>
                        <Td>9:57</Td>
                        <Td>7:00</Td>
                    </Tr>
                </TBody>
            </Table> */}
        </Card>
    )
}

export default TimeAttendance
