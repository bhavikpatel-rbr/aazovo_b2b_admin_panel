import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem } from '@/components/ui/Form'
import { Controller, useFieldArray } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import { HiOutlineTrash } from 'react-icons/hi'
import { Checkbox } from '@/components/ui'

const EquipmentsAssetsSection = ({ control, errors }: FormSectionBaseProps) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'equipmentsAssetsProvided.items',
    })

    const onAddAsset = () => {
        append({
            name: '',
            serial_no: '',
            remark: '',
            provided: true,
        })
    }

    return (
        <Card id="equipmentsAssetsProvided">
            <div className="flex justify-between items-center mb-6">
                <h4>Equipments & Assets Issued</h4>
                <Button type="button" size="sm" onClick={onAddAsset}>
                    Add Asset
                </Button>
            </div>

            <div className="flex flex-col gap-y-6">
                {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md relative">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <FormItem label="Asset Name" className="md:col-span-4">
                                <Controller
                                    name={`equipmentsAssetsProvided.items.${index}.name`}
                                    control={control}
                                    rules={{ required: 'Asset name is required' }}
                                    render={({ field }) => <Input placeholder="e.g., Laptop" {...field} />}
                                />
                            </FormItem>
                            <FormItem label="Serial Number" className="md:col-span-3">
                                <Controller
                                    name={`equipmentsAssetsProvided.items.${index}.serial_no`}
                                    control={control}
                                    render={({ field }) => <Input placeholder="e.g., DL12345XYZ" {...field} />}
                                />
                            </FormItem>
                            <FormItem label="Remark" className="md:col-span-4">
                                <Controller
                                    name={`equipmentsAssetsProvided.items.${index}.remark`}
                                    control={control}
                                    render={({ field }) => <Input placeholder="e.g., New Dell Machine" {...field} />}
                                />
                            </FormItem>
                             <FormItem label="Provided?" className="md:col-span-1 flex items-center justify-center pt-6">
                                <Controller
                                    name={`equipmentsAssetsProvided.items.${index}.provided`}
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            checked={field.value}
                                            onChange={(checked) => field.onChange(checked)}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>
                        <Button
                            shape="circle"
                            size="sm"
                            icon={<HiOutlineTrash />}
                            className="absolute top-2 right-2"
                            type="button"
                            onClick={() => remove(index)}
                        />
                    </div>
                ))}
                {fields.length === 0 && <p className="text-center text-gray-500">No assets added.</p>}
            </div>
        </Card>
    )
}

export default EquipmentsAssetsSection