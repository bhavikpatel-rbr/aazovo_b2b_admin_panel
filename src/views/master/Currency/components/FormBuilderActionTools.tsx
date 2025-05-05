import Button from '@/components/ui/Button'
import { TbCloudDownload, TbUserPlus, TbPlus } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'
import { CSVLink } from 'react-csv'
import { useState } from 'react'
import { Drawer, Form, FormItem, Input, Radio } from '@/components/ui'
import { Controller, useForm } from 'react-hook-form'

const FormListActionTools = () => {
    const navigate = useNavigate()
    const { customerList } = useCustomerList()
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)

    const { handleSubmit, control} = useForm<AddCurrencyFormSchema>({
        defaultValues: {
            symbol: '',
            code: '',
            status: '',
        },
    })

    const addCurrencySubmitHandler = (data: AddCurrencyFormSchema) =>{
        console.log("DAta is ", data)
    }

    type AddCurrencyFormSchema = {
        symbol: string,
        code: string
        status: string
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink
                className="w-full"
                filename="customerList.csv"
                data={customerList}
            >
                <Button
                    icon={<TbCloudDownload className="text-xl" />}
                    className="w-full"
                >
                    Download
                </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus className="text-lg" />}
                // onClick={() => navigate('/concepts/customers/customer-create')}
                onClick={()=>setIsAddDrawerOpen(true)}
            >
                Add New
            </Button>
            <Drawer
                title="Add Currency"
                isOpen={isAddDrawerOpen}
                onClose={()=>setIsAddDrawerOpen(false)}
                onRequestClose={()=>setIsAddDrawerOpen(false)}
                className=""
            >
                <Form size='sm' onSubmit={handleSubmit(addCurrencySubmitHandler)} containerClassName='flex flex-col'>
                    <FormItem label='Curreny Symbol'>
                        <Controller
                            control={control}
                            name='symbol'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Currency Symbol"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label='Curreny Code'>
                        <Controller
                            control={control}
                            name='code'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Currency Code"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label='Status'>
                        <Controller
                            control={control}
                            name='status'
                            render={({field})=>(
                            <Radio.Group
                                radioClass="text-green-500"
                                {...field}
                            >
                                <Radio radioClass='text-green-600' value="Active" name='status'>Active</Radio>
                                <Radio radioClass='text-red-600' value="Inactive" name='status'>Inactive</Radio>
                            </Radio.Group>
                            )}
                        />
                    </FormItem>

                    <div className="text-right w-full absolute bottom-4 right-6">
                        <Button size="sm" className="mr-2" type='button' onClick={() => setIsAddDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" variant="solid" type='submit' onClick={() => setIsAddDrawerOpen(false)}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Drawer>
        </div>
    )
}

export default FormListActionTools
