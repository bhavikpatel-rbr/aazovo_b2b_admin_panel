import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { FormItem } from "@/components/ui/Form";
import DatePicker from "@/components/ui/DatePicker";
import { Button, Form } from "@/components/ui";
import { NavLink } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import { Controller } from 'react-hook-form';

const AddEditLeadPage = () => {
    return (
        <>
        <div className="flex gap-1 items-end mb-3 ">
            <NavLink to="/sales-leads/leads">
                <h6 className="font-semibold hover:text-primary">Leads</h6>
            </NavLink>
            <BiChevronRight size={22} color="black" />
            <h6 className="font-semibold text-primary">Add New LEad</h6>
        </div>
        <Card>
            <h4 className="mb-6">Create Buyer</h4>
            <div className="grid md:grid-cols-3 gap-4">
                            <Form id="leadForm" className="flex flex-col gap-y-4 h-full p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
                    <FormItem label="Member Name" className="lg:col-span-1">
                        <Controller name="memberInfo.name" render={({ field }) => <Input {...field} placeholder="Full name" />} />
                    </FormItem>

                    <FormItem label="Member Email" className="lg:col-span-1">
                        <Controller name="memberInfo.email" render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} />
                    </FormItem>

                    <FormItem label="Member Phone" className="lg:col-span-1">
                        <Controller name="memberInfo.phone" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Phone number" />} />
                    </FormItem>

                    <FormItem label="Lead Status">
                        <Controller name="leadStatus" render={({ field }) => <UiSelect options={leadStatusOptions} value={leadStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Lead Status" />} />
                    </FormItem>

                    <FormItem label="Enquiry Type">
                        <Controller name="enquiryType" render={({ field }) => <UiSelect options={enquiryTypeOptions} value={enquiryTypeOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Enquiry Type" />} />
                    </FormItem>

                    <FormItem label="Lead Intent">
                        <Controller name="leadIntent" render={({ field }) => <UiSelect options={leadIntentOptions} value={leadIntentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Lead Intent" />} />
                    </FormItem>

                    <h6 className="md:col-span-2 lg:col-span-3 text-md font-semibold mt-3 mb-1 border-b">Product/Sourcing Details (Optional)</h6>

                    <FormItem label="Supplier">
                        <Controller name="supplierId" render={({ field }) => <UiSelect options={dummySuppliers.map(s => ({ value: s.id, label: s.name }))} value={dummySuppliers.map(s => ({ value: s.id, label: s.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Supplier" isClearable />} />
                    </FormItem>

                    <FormItem label="Product">
                        <Controller name="productId" render={({ field }) => <UiSelect options={dummyProducts.map(p => ({ value: p.id, label: p.name }))} value={dummyProducts.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product" isClearable />} />
                    </FormItem>

                    <FormItem label="Product Spec">
                        <Controller name="productSpecId" render={({ field }) => <UiSelect options={dummyProductSpecs.filter(s => s.productId === formMethods.watch('productId')).map(s => ({ value: s.id, label: s.name }))} value={dummyProductSpecs.map(s => ({ value: s.id, label: s.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Specification" isDisabled={!formMethods.watch('productId')} isClearable />} />
                    </FormItem>

                    <FormItem label="Quantity">
                        <Controller name="qty" render={({ field }) => <InputNumber {...field} placeholder="Enter Quantity" min={1} value={field.value ?? undefined} onChange={val => field.onChange(val)} />} />
                    </FormItem>

                    <FormItem label="Product Status">
                        <Controller name="productStatus" render={({ field }) => <UiSelect options={productStatusOptionsForm} value={productStatusOptionsForm.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Status" isClearable />} />
                    </FormItem>

                    <FormItem label="Target/Quoted Price">
                        <Controller name="price" render={({ field }) => <InputNumber {...field} placeholder="Enter Price" prefix="$" min={0} precision={2} value={field.value ?? undefined} onChange={val => field.onChange(val)} />} />
                    </FormItem>

                    <FormItem label="Color">
                        <Controller name="color" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Blue" />} />
                    </FormItem>

                    <FormItem label="Cartoon Type">
                        <Controller name="cartoonTypeId" render={({ field }) => <UiSelect options={dummyCartoonTypes.map(ct => ({ value: ct.id, label: ct.name }))} value={dummyCartoonTypes.map(ct => ({ value: ct.id, label: ct.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Cartoon Type" isClearable />} />
                    </FormItem>

                    <FormItem label="Dispatch Status">
                        <Controller name="dispatchStatus" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Ready, Pending" />} />
                    </FormItem>

                    <FormItem label="Payment Term">
                        <Controller name="paymentTermId" render={({ field }) => <UiSelect options={dummyPaymentTerms.map(pt => ({ value: pt.id, label: pt.name }))} value={dummyPaymentTerms.map(pt => ({ value: pt.id, label: pt.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Payment Term" isClearable />} />
                    </FormItem>

                    <FormItem label="Device Condition">
                        <Controller name="deviceCondition" render={({ field }) => <UiSelect options={deviceConditionOptionsForm} value={deviceConditionOptionsForm.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Device Condition" isClearable />} />
                    </FormItem>

                    <FormItem label="ETA">
                        <Controller name="eta" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., 2-3 days" />} />
                    </FormItem>

                    <FormItem label="Location">
                        <Controller name="location" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Dubai Warehouse" />} />
                    </FormItem>

                    <FormItem label="Device Type">
                        <Controller name="deviceType" render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Smartphone, Laptop" />} />
                    </FormItem>

                    <FormItem label="Assigned Sales Person">
                        <Controller name="assignedSalesPersonId" render={({ field }) => <UiSelect options={dummySalesPersons.map(sp => ({ value: sp.id, label: sp.name }))} value={dummySalesPersons.map(sp => ({ value: sp.id, label: sp.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Assign Sales Person" isClearable />} />
                    </FormItem>

                    <FormItem label="Internal Remarks" className="md:col-span-2 lg:col-span-3">
                        <Controller name="internalRemarks" render={({ field }) => <Input textArea {...field} rows={3} value={field.value ?? ''} placeholder="Internal notes..." />} />
                    </FormItem>
                </div>
            </Form>
            </div>
        </Card>
                    {/* Footer with Save and Cancel buttons */}
            <Card bodyClass="flex justify-end gap-2" className="mt-4">
                <Button type="button" className="px-4 py-2">
                    Cancel
                </Button>
                <Button type="button" className="px-4 py-2">
                    Draft
                </Button>
                <Button type="submit" className="px-4 py-2" variant="solid">
                    Save
                </Button>
            </Card>
        </>
    );
};

export default AddEditLeadPage;
