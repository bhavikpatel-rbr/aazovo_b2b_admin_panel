import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import DatePicker from '@/components/ui/DatePicker'

const CreateSellerForm = () => {
    return (
        <Card>
            <h4 className="mb-6">Create Seller</h4>
            <div className="grid md:grid-cols-2 gap-4">

                <FormItem label="Opportunity ID">
                    <Input placeholder="Opportunity ID" />
                </FormItem>

                <FormItem label="Buy Listing ID">
                    <Input placeholder="Buy Listing ID" />
                </FormItem>

                <FormItem label="Sell Listing ID">
                    <Input placeholder="Sell Listing ID" />
                </FormItem>

                <FormItem label="Product Name">
                    <Input placeholder="Product Name" />
                </FormItem>

                <FormItem label="Product Category">
                    <Input placeholder="Product Category" />
                </FormItem>

                <FormItem label="Product Subcategory">
                    <Input placeholder="Product Subcategory" />
                </FormItem>

                <FormItem label="Brand">
                    <Input placeholder="Brand" />
                </FormItem>

                <FormItem label="Price Match Type">
                    <Input placeholder="Exact / Range / Not Matched" />
                </FormItem>

                <FormItem label="Quantity Match">
                    <Input placeholder="Sufficient / Partial / Not Matched" />
                </FormItem>

                <FormItem label="Location Match">
                    <Input placeholder="Local / National / Not Matched" />
                </FormItem>

                <FormItem label="Match Score (%)">
                    <Input placeholder="Match Score" type="number" />
                </FormItem>

                <FormItem label="Opportunity Status">
                    <Input placeholder="New / Shortlisted / Converted / Rejected" />
                </FormItem>

                <FormItem label="Created Date">
                    <DatePicker
                        labelFormat={{
                            month: 'MMMM',
                            year: 'YY',
                        }}
                        defaultValue={new Date()}
                    />
                </FormItem>

                <FormItem label="Last Updated">
                    <DatePicker
                        labelFormat={{
                            month: 'MMMM',
                            year: 'YY',
                        }}
                        defaultValue={new Date()}
                    />
                </FormItem>

                <FormItem label="Assigned To">
                    <Input placeholder="Assigned To" />
                </FormItem>

                <FormItem label="Notes">
                    <Input placeholder="Additional Notes" />
                </FormItem>

                <FormItem label="Status">
                    <Input placeholder="pending / active / on_hold / closed" />
                </FormItem>

            </div>
        </Card>
    )
}

export default CreateSellerForm
