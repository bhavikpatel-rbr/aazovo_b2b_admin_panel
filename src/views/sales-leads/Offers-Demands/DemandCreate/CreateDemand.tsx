import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { FormItem } from "@/components/ui/Form";
import DatePicker from "@/components/ui/DatePicker";
import { NavLink } from 'react-router-dom'
import { BiChevronRight } from 'react-icons/bi'
import { Button, Select } from '@/components/ui'
import { TbCopy, TbPlus, TbTrash } from "react-icons/tb";

const CreateDemand = () => {
  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands">
          <h6 className='font-semibold hover:text-primary'>Offers & Demands</h6>
        </NavLink>
        <BiChevronRight size={22} color='black' />
        <h6 className='font-semibold text-primary'>Add New Demand</h6>
      </div>
      

      <Card>
        <h4 className="mb-6">Add Demand</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <FormItem label="Name">
            <Input placeholder="Enter Name" />
          </FormItem>
          <FormItem label="Assign User">
            <Select placeholder="Select Employee"
              options={[
                { label: "Rahul", value: "Rahul" },
                { label: "Ishan", value: "Ishan" },
              ]}
            />
          </FormItem>

          <div className="flex flex-col gap-4">
            <Card>
              <h5>Buyer Section</h5>
              <div className="text-right">
                <div className="mt-4 flex items-center gap-1">
                  <FormItem label="Buyer ID" className="w-full">
                    <Input placeholder="Search Buyer ID" />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10" />
                  <Button type="button" icon={<TbPlus size={20} />} className="min-h-10 min-w-10" />
                </div>
                <Button icon={<TbPlus />}>Add Buyer</Button>
              </div>
            </Card>
            <Card>
              <h5>Group A</h5>
              <div className="mt-4 ">
                <FormItem>
                  <Input textArea />
                </FormItem>
                <div className="text-right">
                  <Button icon={<TbCopy />} />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <h5>Seller Section</h5>
              <div className="text-right">
                <div className="mt-4 flex items-center gap-1">
                  <FormItem label="Seller ID" className="w-full">
                    <Input placeholder="Search Seller ID" />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10" />
                  <Button type="button" icon={<TbPlus size={20} />} className="min-h-10 min-w-10" />
                </div>
                <Button icon={<TbPlus />}>Add Seller</Button>
              </div>
            </Card>
            <Card>
              <h5>Group B</h5>
              <div className="mt-4 ">
                <FormItem>
                  <Input textArea />
                </FormItem>
                <div className="text-right">
                  <Button icon={<TbCopy />} />
                </div>
              </div>
            </Card>

          </div>

          
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
