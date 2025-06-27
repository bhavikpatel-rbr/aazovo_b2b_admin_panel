import classNames from 'classnames'
import { FC, useState } from 'react'
import { Control, Controller, FieldErrors, useForm } from 'react-hook-form'

// UI Components (Assuming these are in your project structure)
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import { FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { DatePicker, Drawer } from '@/components/ui' // Import Drawer from your UI library

// --- Type Definitions for Form Schema ---

interface CheckableField {
  enabled?: boolean
}

// The main schema for the entire logistics form
export interface LogisticsFormSchema {
  pi: {
    pi_date?: CheckableField
    pi_no?: CheckableField
    company_name?: CheckableField
    bill_to_ship_to?: CheckableField
    model_no?: CheckableField
    qty?: CheckableField
    activation?: CheckableField
    made_in?: CheckableField
    color?: CheckableField
    hsn_code?: CheckableField
    price?: CheckableField
    igst?: CheckableField
    cgst?: CheckableField
    sgst?: CheckableField
    pi_upload?: File | string | null
    remark?: string
  }
  invoice: {
    company_name?: CheckableField
    gst_no?: CheckableField
    pan_no?: CheckableField
    pi_wise_bill_to_ship_to?: CheckableField
    model_no?: CheckableField
    qty?: CheckableField
    price?: CheckableField
    hsn_code?: CheckableField
    igst?: CheckableField
    cgst?: CheckableField
    sgst?: CheckableField
    invoice_upload?: File | string | null
    remark?: string
  }
  imei: {
    activation_check?: boolean
    scan_imei?: File | string | null
    remark?: string
    excel_sheet_miracle?: File | string | null
  }
  eway_bill: {
    eway_bill_no?: string
    eway_bill_date?: Date | string
    gst_no_supplier?: CheckableField
    place_of_dispatche_supplier?: CheckableField
    gst_no_buyer?: CheckableField
    place_of_delivery?: CheckableField
    subject_type?: CheckableField
    supplier_type?: CheckableField
    invoice_no?: CheckableField
    product_name?: CheckableField
    transaction_type?: CheckableField
    taxable_value?: CheckableField
    total_amount?: CheckableField
    hsn_code?: CheckableField
    transporter?: CheckableField
    remark?: string
    eway_bill_upload?: File | string | null
  }
  docate: {
    bill_to_company_name_address?: CheckableField
    ship_to_company_name_address?: CheckableField
    docate_no?: CheckableField
    docate_date?: CheckableField
    invoice_no?: CheckableField
    invoice_model?: CheckableField
    invoice_qty?: CheckableField
    invoice_amount?: CheckableField
    eway_bill_no?: CheckableField
    stamp_signature_docate?: File | string | null
    remark?: string
  }
  photo: {
    person_with_stock?: File | string | null
    vehicle_photo?: File | string | null
    remark?: string
  }
  delivery_status: {
    delivery_done?: boolean
    remark?: string
  }
}

// --- Base Props for Section Components ---
interface FormSectionBaseProps {
  control: Control<LogisticsFormSchema>
  errors: FieldErrors<LogisticsFormSchema>
}

// --- Reusable Field Component for Checkbox ONLY ---
const CheckableFormField: FC<{
  control: Control<any>
  name: string
  label: string
}> = ({ control, name, label }) => {
  return (
    <FormItem>
      <div className="flex items-center gap-2">
        <Controller
          name={`${name}.enabled`}
          control={control}
          render={({ field }) => (
            <Checkbox {...field} checked={!!field.value} />
          )}
        />
        <label
          htmlFor={`${name}.enabled`}
          className="font-semibold text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      </div>
    </FormItem>
  )
}

// --- Navigation ---
const logisticsNavigationList = [
  { label: 'PI', link: 'pi' },
  { label: 'INVOICE', link: 'invoice' },
  { label: 'IMEI', link: 'imei' },
  { label: 'E-WAY BILL', link: 'eway_bill' },
  { label: 'DOCATE', link: 'docate' },
  { label: 'PHOTO', link: 'photo' },
  { label: 'DELIVERY STATUS', link: 'delivery_status' },
]

const NavigatorComponent: FC<{
  activeSection: string
  onNavigate: (sectionKey: string) => void
}> = ({ activeSection, onNavigate }) => (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
    {logisticsNavigationList.map((nav) => (
        <button
        type="button"
        key={nav.link}
        className={classNames(
            'cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max',
            'hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none',
            {
            'bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold':
                activeSection === nav.link,
            'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200':
                activeSection !== nav.link,
            }
        )}
        onClick={() => onNavigate(nav.link)}
        title={nav.label}
        >
        <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
        </span>
        </button>
    ))}
    </div>
)

// --- FORM SECTIONS ---

const PiSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="pi">
    {/* <h4 className="mb-4">Proforma Invoice (PI) Details</h4> */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mt-2">
      <CheckableFormField control={control} name="pi.pi_date" label="PI Date" />
      <CheckableFormField control={control} name="pi.pi_no" label="PI No" />
      <CheckableFormField control={control} name="pi.company_name" label="Company Name" />
      <CheckableFormField control={control} name="pi.bill_to_ship_to" label="Bill To Ship To" />
      <CheckableFormField control={control} name="pi.model_no" label="Model No" />
      <CheckableFormField control={control} name="pi.qty" label="QTY" />
      <CheckableFormField control={control} name="pi.made_in" label="Made In" />
      <CheckableFormField control={control} name="pi.color" label="Color" />
      <CheckableFormField control={control} name="pi.hsn_code" label="HSN Code" />
      <CheckableFormField control={control} name="pi.price" label="Price" />
      <CheckableFormField control={control} name="pi.igst" label="IGST" />
      <CheckableFormField control={control} name="pi.cgst" label="CGST" />
      <CheckableFormField control={control} name="pi.sgst" label="SGST" />
      <CheckableFormField control={control} name="pi.activation" label="Activation" />

      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="PI Upload">
          <Controller name="pi.pi_upload" control={control} render={({ field: { onChange, ref, ...rest } }) => (
              <Input type="file" ref={ref} onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
            )}
          />
        </FormItem>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="Remark">
          <Controller name="pi.remark" control={control} render={({ field }) => (
              <Input textArea placeholder="Enter remarks for PI..." {...field} />
            )}
          />
        </FormItem>
      </div>
    </div>
  </Card>
)

const InvoiceSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="invoice">
    {/* <h4 className="mb-4">Invoice Details</h4> */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mt-2">
      <CheckableFormField control={control} name="invoice.company_name" label="Company Name" />
      <CheckableFormField control={control} name="invoice.gst_no" label="GST No" />
      <CheckableFormField control={control} name="invoice.pan_no" label="PAN No" />
      <CheckableFormField control={control} name="invoice.pi_wise_bill_to_ship_to" label="PI Wise Bill to Ship To" />
      <CheckableFormField control={control} name="invoice.model_no" label="Model No" />
      <CheckableFormField control={control} name="invoice.qty" label="QTY" />
      <CheckableFormField control={control} name="invoice.price" label="Price" />
      <CheckableFormField control={control} name="invoice.hsn_code" label="HSN Code" />
      <CheckableFormField control={control} name="invoice.igst" label="IGST" />
      <CheckableFormField control={control} name="invoice.cgst" label="CGST" />
      <CheckableFormField control={control} name="invoice.sgst" label="SGST" />
      
      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="Invoice Upload">
          <Controller name="invoice.invoice_upload" control={control} render={({ field: { onChange, ...rest } }) => (
            <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
          )} />
        </FormItem>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="Remark">
          <Controller name="invoice.remark" control={control} render={({ field }) => (
            <Input textArea placeholder="Enter remarks for Invoice..." {...field} />
          )} />
        </FormItem>
      </div>
    </div>
  </Card>
)

const ImeiSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="imei">
    {/* <h4 className="mb-4">IMEI Details</h4> */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
      <FormItem label="Scan IMEI as file">
        <Controller name="imei.scan_imei" control={control} render={({ field: { onChange, ...rest } }) => (
          <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
        )} />
      </FormItem>
      <FormItem label="IMEI Excel Sheet (Miracle)">
        <Controller name="imei.excel_sheet_miracle" control={control} render={({ field: { onChange, ...rest } }) => (
          <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
        )} />
      </FormItem>
      <div className="md:col-span-2">
        <FormItem label="">
          <Controller name="imei.activation_check" control={control} render={({ field }) => (
            <Checkbox {...field} checked={!!field.value}> IMEI Activation Check </Checkbox>
          )} />
        </FormItem>
      </div>
      <div className="md:col-span-2">
        <FormItem label="Remark">
          <Controller name="imei.remark" control={control} render={({ field }) => (
            <Input textArea placeholder="Enter remarks for IMEI..." {...field} />
          )} />
        </FormItem>
      </div>
    </div>
  </Card>
)

const EwayBillSection: FC<FormSectionBaseProps> = ({ control }) => (
    <Card id="eway_bill">
        {/* <h4 className="mb-4">E-Way Bill Details</h4> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mt-2">
            <FormItem label="E-Way Bill No">
                <Controller name="eway_bill.eway_bill_no" control={control} render={({ field }) => <Input {...field} placeholder="E-Way Bill Number" />} />
            </FormItem>
            <FormItem label="E-Way Bill Date">
                <Controller name="eway_bill.eway_bill_date" control={control} render={({ field }) => <DatePicker {...field} />} />
            </FormItem>
            <div className="lg:col-span-1"></div> {/* Spacer */}

            <CheckableFormField control={control} name="eway_bill.gst_no_supplier" label="GST No Supplier" />
            <CheckableFormField control={control} name="eway_bill.place_of_dispatche_supplier" label="Place of Dispatch (Supplier)" />
            <CheckableFormField control={control} name="eway_bill.gst_no_buyer" label="GST No of Buyer" />
            <CheckableFormField control={control} name="eway_bill.place_of_delivery" label="Place of Delivery" />
            <CheckableFormField control={control} name="eway_bill.subject_type" label="Subject Type" />
            <CheckableFormField control={control} name="eway_bill.supplier_type" label="Supplier Type" />
            <CheckableFormField control={control} name="eway_bill.invoice_no" label="Invoice No" />
            <CheckableFormField control={control} name="eway_bill.product_name" label="Product Name" />
            <CheckableFormField control={control} name="eway_bill.transaction_type" label="Transaction Type" />
            <CheckableFormField control={control} name="eway_bill.taxable_value" label="Taxable Value" />
            <CheckableFormField control={control} name="eway_bill.total_amount" label="Total Amount" />
            <CheckableFormField control={control} name="eway_bill.hsn_code" label="HSN Code" />
            <CheckableFormField control={control} name="eway_bill.transporter" label="Transporter" />
            
            <div className="md:col-span-2 lg:col-span-3">
              <FormItem label="E-Way Bill Upload">
                <Controller name="eway_bill.eway_bill_upload" control={control} render={({ field: { onChange, ...rest } }) => (
                  <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                )} />
              </FormItem>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <FormItem label="Remark">
                <Controller name="eway_bill.remark" control={control} render={({ field }) => (
                  <Input textArea placeholder="Enter remarks for E-Way Bill..." {...field} />
                )} />
              </FormItem>
            </div>
        </div>
    </Card>
)

const DocateSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="docate">
    {/* <h4 className="mb-4">Docate / Lorry Receipt Details</h4> */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mt-2">
      <CheckableFormField control={control} name="docate.bill_to_company_name_address" label="Bill to Company Name & Address" />
      <CheckableFormField control={control} name="docate.ship_to_company_name_address" label="Ship to Company Name & Address" />
      <CheckableFormField control={control} name="docate.docate_no" label="Docate No" />
      <CheckableFormField control={control} name="docate.docate_date" label="Docate Date" />
      <CheckableFormField control={control} name="docate.invoice_no" label="Invoice No" />
      <CheckableFormField control={control} name="docate.invoice_model" label="Invoice Model" />
      <CheckableFormField control={control} name="docate.invoice_qty" label="Invoice Qty" />
      <CheckableFormField control={control} name="docate.invoice_amount" label="Invoice Amount" />
      <CheckableFormField control={control} name="docate.eway_bill_no" label="E-Way Bill No" />
      
      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="Stamp Signature & Docate Upload">
          <Controller name="docate.stamp_signature_docate" control={control} render={({ field: { onChange, ...rest } }) => (
            <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
          )} />
        </FormItem>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <FormItem label="Remark">
          <Controller name="docate.remark" control={control} render={({ field }) => (
            <Input textArea placeholder="Enter remarks for Docate..." {...field} />
          )} />
        </FormItem>
      </div>
    </div>
  </Card>
)

const PhotoSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="photo">
    {/* <h4 className="mb-4">Photo Uploads</h4> */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
      <FormItem label="Person Photo with Stock">
        <Controller name="photo.person_with_stock" control={control} render={({ field: { onChange, ...rest } }) => (
          <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
        )} />
      </FormItem>
      <FormItem label="Vehicle Photo">
        <Controller name="photo.vehicle_photo" control={control} render={({ field: { onChange, ...rest } }) => (
          <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
        )} />
      </FormItem>
      <div className="md:col-span-2">
        <FormItem label="Remark">
          <Controller name="photo.remark" control={control} render={({ field }) => (
            <Input textArea placeholder="Enter photo remarks..." {...field} />
          )} />
        </FormItem>
      </div>
    </div>
  </Card>
)

const DeliveryStatusSection: FC<FormSectionBaseProps> = ({ control }) => (
  <Card id="delivery_status">
    {/* <h4 className="mb-4">Delivery Status</h4> */}
    <div className="grid grid-cols-1 gap-6 mt-2">
      <FormItem label="">
        <Controller name="delivery_status.delivery_done" control={control} render={({ field }) => (
            <Checkbox {...field} checked={!!field.value}> Delivery Done </Checkbox>
          )}
        />
      </FormItem>
      <FormItem label="Remark">
        <Controller name="delivery_status.remark" control={control} render={({ field }) => (
            <Input textArea placeholder="Enter delivery status remarks..." {...field} />
          )}
        />
      </FormItem>
    </div>
  </Card>
)

// --- MAIN FORM COMPONENT ---

// Dummy images for the left sidebar
const documentImages = [
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
    '/public/img/documents/invoice.avif',
]

const LogisticsForm = () => {
  const [activeSection, setActiveSection] = useState<string>(logisticsNavigationList[0].link);
  const [isImageDrawerOpen, setIsImageDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formMethods = useForm<LogisticsFormSchema>({ defaultValues: {} });

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = formMethods

  const onFormSubmit = (values: LogisticsFormSchema) => {
    console.log('Form Submitted!', values)
    alert('Form submitted! Check the console for the data object.')
  }
  
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDrawerOpen(true);
  };
  
  const closeImageDrawer = () => {
    setIsImageDrawerOpen(false);
    setSelectedImage(null);
  };

  const renderActiveSection = () => {
    const sectionProps = { errors, control }
    switch (activeSection) {
      case 'pi': return <PiSection {...sectionProps} />
      case 'invoice': return <InvoiceSection {...sectionProps} />
      case 'imei': return <ImeiSection {...sectionProps} />
      case 'eway_bill': return <EwayBillSection {...sectionProps} />
      case 'docate': return <DocateSection {...sectionProps} />
      case 'photo': return <PhotoSection {...sectionProps} />
      case 'delivery_status': return <DeliveryStatusSection {...sectionProps} />
      default: return <PiSection {...sectionProps} />
    }
  }

  return (
    <>
      <div className="flex flex-row gap-6">
        {/* Left Column: Document Images */}
        <div className="w-48 flex-shrink-0">
          <Card className="sticky top-0">
            <h5 className="mb-4">Documents</h5>
            <div className="max-h-[80vh] overflow-y-auto pr-2" style={{
                    scrollbarWidth: 'none', // Only works in Firefox
                }}>
                <div className="space-y-4">
                {documentImages.map((img, index) => (
                    <div key={index} className="cursor-pointer border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 rounded-md overflow-hidden" onClick={() => handleImageClick(img)}>
                        <img src={img} alt={`Document ${index + 1}`} className="w-full h-auto object-cover" />
                    </div>
                ))}
                </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Main Form */}
        <div className="flex-grow">
            <h3 className="mb-4">CRM PI 1.0.2</h3>
            <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
                <NavigatorComponent
                activeSection={activeSection}
                onNavigate={setActiveSection}
                />
            </Card>
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
                {renderActiveSection()}
            </form>
        </div>
      </div>
      
      {/* Footer and Drawer */}
      <Card className="mt-6 bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end items-center p-4 gap-2">
            <Button>Cancel</Button>
            <Button variant="solid" type="submit" onClick={handleSubmit(onFormSubmit)}>Save</Button>
        </div>
      </Card>
      
      <Drawer
        title="Document Viewer"
        isOpen={isImageDrawerOpen}
        onClose={closeImageDrawer}
        onRequestClose={closeImageDrawer}
        placement="left" // Assuming your Drawer component supports placement
        width={500}
      >
        <div className="p-4 h-full overflow-y-auto"  style={{
                    scrollbarWidth: 'none', // Only works in Firefox
                }}>
            {selectedImage && (
                <img src={selectedImage} alt="Selected Document" className="w-full h-auto" />
            )}
        </div>
      </Drawer>
    </>
  )
}

export default LogisticsForm