import { useForm, Controller } from 'react-hook-form'
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { FormItem } from '@/components/ui/Form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
const CreatePartner = () => {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const onSubmit = (data: any) => {
        console.log("Partner submitted", data)
    }

    return (
<>
    <Container>
        <AdaptiveCard>
        <div className="flex flex-col gap-4 max-w-4xl mx-auto p-2">
            <h5 className="text-2xl font-bold">Fill Partner Details</h5>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Partner Name */}
                <FormItem label="Partner Name" invalid={Boolean(errors.partner_name)} errorMessage={
                    typeof errors.partner_name?.message === 'string'
                    ? errors.partner_name.message
                    : undefined
                }>
                    <Controller
                        name="partner_name"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="Enter partner name" {...field} />
                        )}
                    />
                </FormItem>

                {/* Contact Number */}
                <FormItem label="Contact Number" invalid={Boolean(errors.partner_contact_number)} errorMessage={
                    typeof errors.partner_contact_number?.message === 'string'
                    ? errors.partner_contact_number.message
                    : undefined
                }>
                    <Controller
                        name="partner_contact_number"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="Enter contact number" {...field} />
                        )}
                    />
                </FormItem>

                {/* Email */}
                <FormItem label="Email" invalid={Boolean(errors.partner_email_id)} errorMessage={
                    typeof errors.partner_email_id?.message === 'string'
                    ? errors.partner_email_id.message
                    : undefined
                }>
                    <Controller
                        name="partner_email_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="email" placeholder="Enter email" {...field} />
                        )}
                    />
                </FormItem>

                {/* Logo URL */}
                <FormItem label="Logo URL" invalid={Boolean(errors.partner_logo)} errorMessage={
                    typeof errors.partner_logo?.message === 'string'
                    ? errors.partner_logo.message
                    : undefined
                }>
                    <Controller
                        name="partner_logo"
                        control={control}
                        render={({ field }) => (
                            <Input type="url" placeholder="Enter logo URL" {...field} />
                        )}
                    />
                </FormItem>

                {/* Status */}
                <FormItem label="Partner Status" invalid={Boolean(errors.partner_status)} errorMessage={
                    typeof errors.partner_status?.message === 'string'
                    ? errors.partner_status.message
                    : undefined
                }>
                    <Controller
                        name="partner_status"
                        control={control}
                        render={() => (
                            <Select 
                                placeholder="Select status"
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' },
                                    { value: 'Pending', label: 'Pending' },
                                ]}
                            />
                        )}
                    />
                </FormItem>

                {/* Join Date */}
                <FormItem label="Join Date" invalid={Boolean(errors.partner_join_date)} errorMessage={
                    typeof errors.partner_join_date?.message === 'string'
                    ? errors.partner_join_date.message
                    : undefined
                }>
                    <Controller
                        name="partner_join_date"
                        control={control}
                        render={({ field }) => (
                            <Input type="date" {...field} />
                        )}
                    />
                </FormItem>

                {/* Partner Location */}
                <FormItem label="Location" invalid={Boolean(errors.partner_location)} errorMessage={
                    typeof errors.partner_location?.message === 'string'
                    ? errors.partner_location.message
                    : undefined
                }>
                    <Controller
                        name="partner_location"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="City, Country" {...field} />
                        )}
                    />
                </FormItem>

                {/* Profile Completion */}
                <FormItem label="Profile Completion %" invalid={Boolean(errors.partner_profile_completion)} errorMessage={
                    typeof errors.partner_profile_completion?.message === 'string'
                    ? errors.partner_profile_completion.message
                    : undefined
                }>
                    <Controller
                        name="partner_profile_completion"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" step="0.01" placeholder="0 - 100" {...field} />
                        )}
                    />
                </FormItem>

                {/* Trust Score */}
                <FormItem label="Trust Score" invalid={Boolean(errors.partner_trust_score)} errorMessage={
                    typeof errors.partner_trust_score?.message === 'string'
                    ? errors.partner_trust_score.message
                    : undefined
                }>
                    <Controller
                        name="partner_trust_score"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Enter trust score" {...field} />
                        )}
                    />
                </FormItem>

                {/* Activity Score */}
                <FormItem label="Activity Score" invalid={Boolean(errors.partner_activity_score)} errorMessage={
                    typeof errors.partner_activity_score?.message === 'string'
                    ? errors.partner_activity_score.message
                    : undefined
                }>
                    <Controller
                        name="partner_activity_score"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Enter activity score" {...field} />
                        )}
                    />
                </FormItem>

                {/* KYC Status */}
                <FormItem label="KYC Status" invalid={Boolean(errors.partner_kyc_status)} errorMessage={
                    typeof errors.partner_kyc_status?.message === 'string'
                    ? errors.partner_kyc_status.message
                    : undefined
                }>
                    <Controller
                        name="partner_kyc_status"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="e.g., Verified / Not Verified" {...field} />
                        )}
                    />
                </FormItem>

                {/* Business Type */}
                <FormItem label="Business Type" invalid={Boolean(errors.partner_business_type)} errorMessage={
                    typeof errors.partner_business_type?.message === 'string'
                    ? errors.partner_business_type.message
                    : undefined
                }>
                    <Controller
                        name="partner_business_type"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="e.g., B2B, B2C" {...field} />
                        )}
                    />
                </FormItem>

                {/* Interested In */}
                <FormItem label="Interested In" invalid={Boolean(errors.partner_interested_in)} errorMessage={
                    typeof errors.partner_interested_in?.message === 'string'
                    ? errors.partner_interested_in.message
                    : undefined
                }>
                    <Controller
                        name="partner_interested_in"
                        control={control}
                        render={() => (
                            <Select
                                placeholder="Select interested in"
                                options={[
                                    { value: 'Buy', label: 'Buy' },
                                    { value: 'Sell', label: 'Sell' },
                                    { value: 'Both', label: 'Both' },
                                    { value: 'None', label: 'None' },
                                ]}
                            />
                        )}
                    />
                </FormItem>

                {/* Website */}
                <FormItem label="Website URL" invalid={Boolean(errors.partner_website)} errorMessage={
                    typeof errors.partner_website?.message === 'string'
                    ? errors.partner_website.message
                    : undefined
                }>
                    <Controller
                        name="partner_website"
                        control={control}
                        render={({ field }) => (
                            <Input type="url" placeholder="https://example.com" {...field} />
                        )}
                    />
                </FormItem>

                {/* Payment Terms */}
                <FormItem label="Payment Terms" invalid={Boolean(errors.partner_payment_terms)} errorMessage={
                    typeof errors.partner_payment_terms?.message === 'string'
                    ? errors.partner_payment_terms.message
                    : undefined
                }>
                    <Controller
                        name="partner_payment_terms"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="e.g., Net 30" {...field} />
                        )}
                    />
                </FormItem>

                {/* Document Upload */}
                <FormItem label="Document Upload URL" invalid={Boolean(errors.partner_document_upload)} errorMessage={
                    typeof errors.partner_document_upload?.message === 'string'
                    ? errors.partner_document_upload.message
                    : undefined
                }>
                    <Controller
                        name="partner_document_upload"
                        control={control}
                        render={({ field }) => (
                            <Input type="url" placeholder="Enter document URL" {...field} />
                        )}
                    />
                </FormItem>

                {/* Reference ID / Contact */}
                <FormItem label="Reference Contact/ID" invalid={Boolean(errors.partner_reference_id)} errorMessage={
                    typeof errors.partner_reference_id?.message === 'string'
                    ? errors.partner_reference_id.message
                    : undefined
                }>
                    <Controller
                        name="partner_reference_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" placeholder="Reference name or ID" {...field} />
                        )}
                    />
                </FormItem>

                {/* Lead Time */}
                <FormItem label="Lead Time (days)" invalid={Boolean(errors.partner_lead_time)} errorMessage={
                    typeof errors.partner_lead_time?.message === 'string'
                    ? errors.partner_lead_time.message
                    : undefined
                }>
                    <Controller
                        name="partner_lead_time"
                        control={control}
                        render={({ field }) => (
                            <Input type="number" placeholder="Enter lead time" {...field} />
                        )}
                    />
                </FormItem>
                {/* Footer with Save and Cancel buttons */}
  

            </form>
        </div>
                      <div className="flex justify-end gap-x-3 mt-4">
                    <Button type="button" className="px-4 py-2 rounded">Cancel</Button>
                    <Button type="submit" className="px-4 py-2 rounded" variant="solid">Save</Button>
                </div>
                        </AdaptiveCard>
            </Container>
            </>
    )
}

export default CreatePartner
