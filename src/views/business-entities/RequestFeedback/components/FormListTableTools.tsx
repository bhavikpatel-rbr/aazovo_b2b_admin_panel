import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'
import React, { useState } from 'react'

import cloneDeep from 'lodash/cloneDeep'
import FormListSearch from './FormListSearch'
import FormListTableFilter from './FormListTableFilter'

import { TbCloudDownload, TbFilter } from 'react-icons/tb'
import { Button, Drawer, Form, FormItem, Input, Select, DatePicker } from '@/components/ui'
import { Controller, useForm } from 'react-hook-form'

const FormListTableTools = () => {
    const { tableData, setTableData } = useCustomerList()

    const handleInputChange = (val: string) => {
        const newTableData = cloneDeep(tableData)
        newTableData.query = val
        newTableData.pageIndex = 1
        if (typeof val === 'string' && val.length > 1) {
            setTableData(newTableData)
        }

        if (typeof val === 'string' && val.length === 0) {
            setTableData(newTableData)
        }
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const openFilterDrawer = () => setIsFilterDrawerOpen(true)
    const filtersSubmitHandler = (data) => {
        console.log("filter data", data)
        closeFilterDrawer()
    }

    const {control, handleSubmit} = useForm()
    const { DatePickerRange } = DatePicker

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <FormListSearch onInputChange={handleInputChange} />
            {/* <FormListTableFilter /> */}
            <Button icon={<TbFilter />} className='' onClick={openFilterDrawer}>
                Filter
            </Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
            >
                <Form size='sm' onSubmit={handleSubmit(filtersSubmitHandler)} containerClassName='grid grid-rows-[auto_80px]'>
                    <div className="">
                    <FormItem label="Type">
                            <Controller
                                name='type'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Type"
                                            isMulti={true}
                                            options={[
                                                {label:"Feedback",value:"Feedback"}, 
                                                {label:"Support",value:"Support"}, 
                                                {label:"Request",value:"Request"}, 
                                            ]}
                                            onChange={(options)=>{
                                                const values = options.map(option => option.value)
                                                field.onChange(values)
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label="Status">
                            <Controller
                                name='status'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Status"
                                            isMulti={true}
                                            options={[
                                                {label:"Active",value:"Active"}, 
                                                {label:"Inactive", value:"Inactive"},
                                                {label:"Open", value:"Open"},
                                                {label:"Resolved", value:"Resolved"},
                                                {label:"Notify", value:"Notify"},
                                            ]}
                                            onChange={(options)=>{
                                                const values = options.map(option => option.value)
                                                field.onChange(values)
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label="Department">
                            <Controller
                                name='department'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Department"
                                            isMulti={true}
                                            options={[
                                                {label:"IT",value:"IT"},
                                                {label:"Sales",value:"Sales"},
                                                {label:"Marketing",value:"Marketing"},
                                            ]}
                                            onChange={(options)=>{
                                                const values = options.map(option => option.value)
                                                field.onChange(values)
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label="Date">
                            <Controller
                                name='date'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <DatePickerRange
                                            placeholder="Select Date Range"
                                            {...field}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        
                    </div>
                    <div className="text-right border-t border-t-gray-200 w-full absolute bottom-0 py-4 right-0 pr-6 bg-white dark:bg-gray-700">
                        <Button size="sm" className="mr-2" type='button' onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                        <Button size="sm" variant="solid" type='submit'>
                            Apply
                        </Button>
                    </div>
                </Form>
            </Drawer>
            {/* Export */}
            <Button icon={<TbCloudDownload />}> Export </Button>
        </div>
    )
}

export default FormListTableTools
