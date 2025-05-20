import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'

import cloneDeep from 'lodash/cloneDeep'
import FormListSearch from './FormListSearch'
import FormListTableFilter from './FormListTableFilter'
import { Button, DatePicker, Drawer, Form, FormItem, Select } from '@/components/ui'
import { TbCloudDownload, TbCloudUpload, TbFilter } from 'react-icons/tb'
import { useState } from 'react'

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

    const [filterOpen, setFilterOpen] = useState(false)

    const openFilterDrawer = () => setFilterOpen(true)
    const closeFilterDrawer = () => setFilterOpen(false)

    const { DatePickerRange } = DatePicker

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <FormListSearch onInputChange={handleInputChange} />
            {/* <FormListTableFilter /> */}
            <Button icon={<TbFilter />} onClick={() => openFilterDrawer()}>Filter</Button>
            <Drawer
                title="Filters"
                isOpen={filterOpen}
                onClose={closeFilterDrawer}
                width={480}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2">Clear</Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            form="filterUnitForm"
                            type="submit"
                        >
                            {' '}Apply{' '}
                        </Button>{' '}
                    </div>
                }
            >
                <Form className=''>
                    <div className='md:grid grid-cols-2 gap-2'>
                        <FormItem label='Status' className=''>
                            <Select placeholder="Select Status" isMulti={true} options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" },
                            ]} />
                        </FormItem>
                        <FormItem label='Business Type'>
                            <Select placeholder="Select Business Type" isMulti={true} options={[
                                { value: "Active", label: "Manufacture" },
                                { value: "Inactive", label: "Supplier" },
                            ]} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-2'>
                        <FormItem label='Continent' className=''>
                            <Select placeholder="Select Continent" isMulti={true} options={[
                                { value: "Active", label: "Asia" },
                                { value: "Inactive", label: "USA" },
                            ]} />
                        </FormItem>
                        <FormItem label='Country'>
                            <Select placeholder="Select Country" isMulti={true} options={[
                                { value: "Active", label: "India" },
                                { value: "Inactive", label: "Nepal" },
                            ]} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-2'>
                        <FormItem label='State'>
                            <Select placeholder="Select State" isMulti={true} options={[
                                { value: "Active", label: "Gujarat" },
                                { value: "Inactive", label: "Rajasthan" },
                            ]} />
                        </FormItem>
                        <FormItem label='City'>
                            <Select placeholder="Select City" isMulti={true} options={[
                                { value: "Active", label: "Ahmedabad" },
                                { value: "Inactive", label: "Gandhinagar" },
                            ]} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-2'>
                        <FormItem label='Interested For'>
                            <Select placeholder="Interested For" isMulti={true} options={[
                                { value: "Active", label: "Buy" },
                                { value: "Inactive", label: "Sell" },
                                { value: "Inactive", label: "Both" },
                            ]} />
                        </FormItem>
                        <FormItem label='Brand'>
                            <Select placeholder="Select Brand" isMulti={true} options={[
                                { value: "Active", label: "Apple" },
                                { value: "Inactive", label: "Samsung" },
                                { value: "Inactive", label: "Nokia" },
                            ]} />
                        </FormItem>
                    </div>
                    <div className='md:grid grid-cols-2 gap-2'>
                        <FormItem label='Category'>
                            <Select placeholder="Category" isMulti={true} options={[
                                { value: "Inactive", label: "Electronics" },
                                { value: "Inactive", label: "Food" },
                                { value: "Inactive", label: "Plastic" },
                            ]} />
                        </FormItem>
                        <FormItem label='Sub Category'>
                            <Select placeholder="Sub Category" isMulti={true} options={[
                                { value: "Active", label: "Mobile" },
                                { value: "Inactive", label: "Tablet" },
                                { value: "Inactive", label: "TV" },
                            ]} />
                        </FormItem>

                    </div>
                    <div className='md:grid grid-cols-2 gap-2'>

                        <FormItem label='KYC Verified'>
                            <Select placeholder="KYC Verified" isMulti={true} options={[
                                { value: "Active", label: "Yes" },
                                { value: "Active", label: "No" },
                            ]} />
                        </FormItem>
                        <FormItem label='Enable Billing'>
                            <Select placeholder="Enable Billing" isMulti={true} options={[
                                { value: "Active", label: "Yes" },
                                { value: "Active", label: "No" },
                            ]} />
                        </FormItem>
                    </div>
                    <FormItem label='Business Type'>
                        <Select placeholder="Select Business type" isMulti={true} options={[
                            { value: "Active", label: "Private Limited" },
                            { value: "Inactive", label: "Charitable Trust" },
                        ]} />
                    </FormItem>
                    <FormItem label='Created Date'>
                        <DatePickerRange placeholder='Select Date Range' />
                    </FormItem>
                </Form>
            </Drawer>
            <Button icon={<TbCloudDownload />}>Import</Button>
            <Button icon={<TbCloudUpload />}>Export</Button>
        </div>
    )
}

export default FormListTableTools
