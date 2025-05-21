import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { FormItem } from "@/components/ui/Form";
import DatePicker from "@/components/ui/DatePicker";
import { NavLink } from 'react-router-dom'
import { BiChevronRight } from 'react-icons/bi'
import { Button } from '@/components/ui'

const CreateDemand = () => {
  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
          <NavLink to="/business-entities/company">
              <h6 className='font-semibold hover:text-primary'>Offers & Demands</h6>
          </NavLink>
          <BiChevronRight size={22} color='black'/>
          <h6 className='font-semibold text-primary'>Add New Demand</h6>
      </div>
    <Card>
      <h4 className="mb-6">Create Demand</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem label="Demand Name">
          <Input placeholder="Enter Demand name" />
        </FormItem>

        <FormItem label="Created By">
          <Input placeholder="User ID or name" />
        </FormItem>

        <FormItem label="Created Date">
          <DatePicker
            labelFormat={{ month: "MMMM", year: "YY" }}
            defaultValue={new Date()}
          />
        </FormItem>

        <FormItem label="Type">
          <Input value="Demand" disabled />
        </FormItem>

        <FormItem label="Demand ID">
          <Input placeholder="Auto-generated or custom ID" />
        </FormItem>
      </div>
    </Card>
    {/* Footer with Save and Cancel buttons */}
    <Card bodyClass="flex justify-end gap-2" className='mt-4'>
        <Button type="button" className="px-4 py-2">Cancel</Button>
        <Button type="button" className="px-4 py-2">Draft</Button>
        <Button type="submit" className="px-4 py-2" variant="solid">Save</Button>
    </Card>
    </>
  );
};

export default CreateDemand;
