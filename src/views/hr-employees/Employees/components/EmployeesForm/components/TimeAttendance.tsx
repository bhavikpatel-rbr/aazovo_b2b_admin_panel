import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button, FormItem, Input, Select, Table } from '@/components/ui'
import type { FormSectionBaseProps } from '../types'
import Tr from '@/components/ui/Table/Tr'
import Td from '@/components/ui/Table/Td'
import TBody from '@/components/ui/Table/TBody'
import { DataTable } from '@/components/shared'
import Tabs from '@/components/ui/Tabs'
import { TbCloudDownload, TbCloudUpload } from 'react-icons/tb'

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
    
    const { TabNav, TabList, TabContent } = Tabs

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

    const columns = [
        {header : "Date", accessorKey : "date"},
        {header : "In Time", accessorKey : "in_time", cell : props => <Input type='time' />},
        {header : "Out Time", accessorKey : "out_time", cell : props => <Input type='time' />},
        {header : "Total Hours", accessorKey : "total_hours", size: 170},
        {
            header : "Status", 
            accessorKey : "status", 
            size: 180,
            cell : props => (
                <Select
                    placeholder="Status..."
                    options={[
                        {label : "Present", value: "Present"},
                        {label : "Absent", value: "Absent"},
                        {label : "Leave", value: "Leave"},
                    ]}
                />
            )
        },
        {
            header : "Counts", 
            id: "counts",
            size: 200,
            cell : props => (
                <div className='text-xs'>
                    <span>Lates {" : "} 0</span> <br />
                    <span>Early Leaves {" : "} 0</span>
                </div>
            )
        },
        // {header : "Lates", accessorKey : "late_count"},
        // {header : "Early Leaves", accessorKey : "early_leave_count", size: 170},
        {header : "Action", cell : props => <Button type='button' size='xs'>Save</Button>},
    ]
    const data = [
        {
            date : "12-03-2024", in_time: "1 PM", out_time: "7 PM", total_hours: 6, status: "Active", late_count: 0, early_leave_count: 0,
        },
        {
            date : "12-03-2024", in_time: "1 PM", out_time: "7 PM", total_hours: 6, status: "Active", late_count: 0, early_leave_count: 0,
        },
        {
            date : "12-03-2024", in_time: "1 PM", out_time: "7 PM", total_hours: 6, status: "Active", late_count: 0, early_leave_count: 0,
        },
        {
            date : "12-03-2024", in_time: "1 PM", out_time: "7 PM", total_hours: 6, status: "Active", late_count: 0, early_leave_count: 0,
        },
        {
            date : "12-03-2024", in_time: "1 PM", out_time: "7 PM", total_hours: 6, status: "Active", late_count: 0, early_leave_count: 0,
        },
    ]

    return (
        <Card id="timeAttendence">
            <h4 className="mb-6">Time Attendance</h4>
            <div className="flex gap-4 items-end">
                
                <div className='w-full flex flex-col gap-2'>
                    <div>
                        <Button
                            type="button"
                            onClick={handleInClick}
                            variant="outline"
                            className="px-6 py-2"
                        >
                            {inTime ? `In: ${inTime}` : 'In'}
                        </Button>
                    </div>
                    <Input type="time" />
                </div>
                <div className='w-full flex flex-col gap-2'>
                    <div>
                        <Button
                            type="button"
                            onClick={handleOutClick}
                            variant="outline"
                            className="px-6 py-2"
                        >
                            {outTime ? `Out: ${outTime}` : 'Out'}
                        </Button>
                    </div>
                    <Input type="time" defaultValue={outTime}/>
                </div>

                <Button type='button' size='md'>Save</Button>
            </div>
            <Tabs defaultValue='system' className='mt-3'>
                <TabList>
                    <TabNav value='system'>System</TabNav>
                    <TabNav value='biometric'>Biometric</TabNav>
                </TabList>
                <div>
                    <TabContent value="system">
                        <div className='flex gap-2 justify-between my-2 mt-4'>
                            <h6>System Attendance</h6>
                            <div>
                                <Button icon={<TbCloudUpload/>}>Export</Button>
                            </div>
                        </div>
                        <DataTable columns={columns} data={data} className='mt-4'/>              
                    </TabContent>
                    <TabContent value="biometric">
                        <div className='flex gap-2 justify-between my-2 mt-4'>
                            <h6>Biometric Attendance</h6>
                            <div className='flex gap-2'>
                                <Button icon={<TbCloudDownload/>}>Import</Button>
                                <Button icon={<TbCloudUpload/>}>Export</Button>
                            </div>
                        </div>
                        <DataTable columns={columns} data={data} className='mt-4'/>              
                    </TabContent>
                </div>
            </Tabs>
        </Card>
    )
}

export default TimeAttendance
