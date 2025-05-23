import React from 'react';
import { Button, Drawer, Form, FormItem, Input, InputNumber, UiSelect } from '@/components/ui';
import { Controller } from 'react-hook-form';

const AddEditLeadPage = ({
  isOpen,
  onClose,
  onSubmit,
  formMethods,
  isSubmitting,
  editingLead,
  dummySuppliers,
  dummyProducts,
  dummyProductSpecs,
  dummyCartoonTypes,
  dummyPaymentTerms,
  dummySalesPersons,
  leadStatusOptions,
  enquiryTypeOptions,
  leadIntentOptions,
  productStatusOptionsForm,
  deviceConditionOptionsForm,
}) => {
  return (
    <Drawer
      title={editingLead?.id ? 'Edit Lead' : 'Add New Lead'}
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={800}
      footer={
        <div className="text-right p-4 border-t">
          <Button size="sm" className="mr-2" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            size="sm"
            variant="solid"
            form="leadForm"
            type="submit"
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              (!editingLead && !formMethods.formState.isValid) ||
              (editingLead && !formMethods.formState.isDirty && !formMethods.formState.isValid)
            }
          >
            {isSubmitting ? (editingLead ? 'Saving...' : 'Adding...') : (editingLead ? 'Save Changes' : 'Create Lead')}
          </Button>
        </div>
      }
    >
      <Form id="leadForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-y-4 h-full p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
          <FormItem label="Member Name" className="lg:col-span-1" invalid={!!formMethods.formState.errors.memberInfo?.name} errorMessage={formMethods.formState.errors.memberInfo?.name?.message}>
            <Controller name="memberInfo.name" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Full name" />} />
          </FormItem>

          <FormItem label="Member Email" className="lg:col-span-1" invalid={!!formMethods.formState.errors.memberInfo?.email} errorMessage={formMethods.formState.errors.memberInfo?.email?.message}>
            <Controller name="memberInfo.email" control={formMethods.control} render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} />
          </FormItem>

          <FormItem label="Member Phone" className="lg:col-span-1">
            <Controller name="memberInfo.phone" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Phone number" />} />
          </FormItem>

          <FormItem label="Lead Status" invalid={!!formMethods.formState.errors.leadStatus} errorMessage={formMethods.formState.errors.leadStatus?.message}>
            <Controller name="leadStatus" control={formMethods.control} render={({ field }) => <UiSelect options={leadStatusOptions} value={leadStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Lead Status" />} />
          </FormItem>

          <FormItem label="Enquiry Type" invalid={!!formMethods.formState.errors.enquiryType} errorMessage={formMethods.formState.errors.enquiryType?.message}>
            <Controller name="enquiryType" control={formMethods.control} render={({ field }) => <UiSelect options={enquiryTypeOptions} value={enquiryTypeOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Enquiry Type" />} />
          </FormItem>

          <FormItem label="Lead Intent" invalid={!!formMethods.formState.errors.leadIntent} errorMessage={formMethods.formState.errors.leadIntent?.message}>
            <Controller name="leadIntent" control={formMethods.control} render={({ field }) => <UiSelect options={leadIntentOptions} value={leadIntentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Lead Intent" />} />
          </FormItem>

          <h6 className="md:col-span-2 lg:col-span-3 text-md font-semibold mt-3 mb-1 border-b">Product/Sourcing Details (Optional)</h6>

          <FormItem label="Supplier">
            <Controller name="supplierId" control={formMethods.control} render={({ field }) => <UiSelect options={dummySuppliers.map(s => ({ value: s.id, label: s.name }))} value={dummySuppliers.map(s => ({ value: s.id, label: s.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Supplier" isClearable />} />
          </FormItem>

          <FormItem label="Product" invalid={!!formMethods.formState.errors.productId} errorMessage={formMethods.formState.errors.productId?.message}>
            <Controller name="productId" control={formMethods.control} render={({ field }) => <UiSelect options={dummyProducts.map(p => ({ value: p.id, label: p.name }))} value={dummyProducts.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product" isClearable />} />
          </FormItem>

          <FormItem label="Product Spec" invalid={!!formMethods.formState.errors.productSpecId} errorMessage={formMethods.formState.errors.productSpecId?.message}>
            <Controller name="productSpecId" control={formMethods.control} render={({ field }) => <UiSelect options={dummyProductSpecs.filter(s => s.productId === formMethods.watch('productId')).map(s => ({ value: s.id, label: s.name }))} value={dummyProductSpecs.map(s => ({ value: s.id, label: s.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Specification" isDisabled={!formMethods.watch('productId')} isClearable />} />
          </FormItem>

          <FormItem label="Quantity" invalid={!!formMethods.formState.errors.qty} errorMessage={formMethods.formState.errors.qty?.message}>
            <Controller name="qty" control={formMethods.control} render={({ field }) => <InputNumber {...field} placeholder="Enter Quantity" min={1} value={field.value ?? undefined} onChange={val => field.onChange(val)} />} />
          </FormItem>

          <FormItem label="Product Status" invalid={!!formMethods.formState.errors.productStatus} errorMessage={formMethods.formState.errors.productStatus?.message}>
            <Controller name="productStatus" control={formMethods.control} render={({ field }) => <UiSelect options={productStatusOptionsForm} value={productStatusOptionsForm.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Status" isClearable />} />
          </FormItem>

          <FormItem label="Target/Quoted Price" invalid={!!formMethods.formState.errors.price} errorMessage={formMethods.formState.errors.price?.message}>
            <Controller name="price" control={formMethods.control} render={({ field }) => <InputNumber {...field} placeholder="Enter Price" prefix="$" min={0} precision={2} value={field.value ?? undefined} onChange={val => field.onChange(val)} />} />
          </FormItem>

          <FormItem label="Color">
            <Controller name="color" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Blue" />} />
          </FormItem>

          <FormItem label="Cartoon Type">
            <Controller name="cartoonTypeId" control={formMethods.control} render={({ field }) => <UiSelect options={dummyCartoonTypes.map(ct => ({ value: ct.id, label: ct.name }))} value={dummyCartoonTypes.map(ct => ({ value: ct.id, label: ct.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Cartoon Type" isClearable />} />
          </FormItem>

          <FormItem label="Dispatch Status">
            <Controller name="dispatchStatus" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Ready, Pending" />} />
          </FormItem>

          <FormItem label="Payment Term">
            <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => <UiSelect options={dummyPaymentTerms.map(pt => ({ value: pt.id, label: pt.name }))} value={dummyPaymentTerms.map(pt => ({ value: pt.id, label: pt.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Payment Term" isClearable />} />
          </FormItem>

          <FormItem label="Device Condition">
            <Controller name="deviceCondition" control={formMethods.control} render={({ field }) => <UiSelect options={deviceConditionOptionsForm} value={deviceConditionOptionsForm.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Device Condition" isClearable />} />
          </FormItem>

          <FormItem label="ETA">
            <Controller name="eta" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., 2-3 days" />} />
          </FormItem>

          <FormItem label="Location">
            <Controller name="location" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Dubai Warehouse" />} />
          </FormItem>

          <FormItem label="Device Type">
            <Controller name="deviceType" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g., Smartphone, Laptop" />} />
          </FormItem>

          <FormItem label="Assigned Sales Person">
            <Controller name="assignedSalesPersonId" control={formMethods.control} render={({ field }) => <UiSelect options={dummySalesPersons.map(sp => ({ value: sp.id, label: sp.name }))} value={dummySalesPersons.map(sp => ({ value: sp.id, label: sp.name })).find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Assign Sales Person" isClearable />} />
          </FormItem>

          <FormItem label="Internal Remarks" className="md:col-span-2 lg:col-span-3">
            <Controller name="internalRemarks" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={3} value={field.value ?? ''} placeholder="Internal notes..." />} />
          </FormItem>
        </div>
      </Form>
    </Drawer>
  );
};

export default AddEditLeadPage;
