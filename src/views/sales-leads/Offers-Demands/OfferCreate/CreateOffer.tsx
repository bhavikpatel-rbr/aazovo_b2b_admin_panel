import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import DatePicker from '@/components/ui/DatePicker'

const CreateOffer = () => {
    return (
        <Card>
            <h4 className="mb-6">Create Offer</h4>
            <div className="grid md:grid-cols-3 gap-4">

                <FormItem label="Offer Name">
                    <Input placeholder="Enter offer name" />
                </FormItem>

                <FormItem label="Created By">
                    <Input placeholder="User ID or name" />
                </FormItem>

                <FormItem label="Created Date">
                    <DatePicker
                        labelFormat={{ month: 'MMMM', year: 'YY' }}
                        defaultValue={new Date()}
                    />
                </FormItem>

                <FormItem label="Type">
                    <Input value="Offer" disabled />
                </FormItem>

                <FormItem label="Offer ID">
                    <Input placeholder="Auto-generated or custom ID" />
                </FormItem>

            </div>
        </Card>
    )
}

export default CreateOffer
