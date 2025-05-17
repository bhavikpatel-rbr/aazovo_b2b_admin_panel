import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
type RequestAndFeedbacksDetailSectionProps = FormSectionBaseProps
const RequestAndFeedbacksDetails = ({
    control,
    errors,
}: RequestAndFeedbacksDetailSectionProps) => {

    return (
<Card id="requestAndFeedbacks">
    <h4 className="mb-6">Request & Feedback</h4>
    <div className="grid md:grid-cols-2 gap-4">

        {/* Request Type */}
        <FormItem label="Request Type" invalid={Boolean(errors.request_type)} errorMessage={errors.request_type?.message}>
            <Controller
                name="request_type"
                control={control}
                render={() => (
                    <Select placeholder="Select request type"
                    options={[
                        { value: 'Query', label: 'Query' },
                        { value: 'Feature Request', label: 'Feature Request' },
                        { value: 'Complaint', label: 'Complaint' },
                        { value: 'Other', label: 'Other' },
                    ]}
                    >
                    </Select>
                )}
            />
        </FormItem>

        {/* Request Subject */}
        <FormItem label="Request Subject" invalid={Boolean(errors.request_subject)} errorMessage={errors.request_subject?.message}>
            <Controller
                name="request_subject"
                control={control}
                render={({ field }) => (
                    <Input type="text" placeholder="Enter subject" {...field} />
                )}
            />
        </FormItem>

        {/* Request Description */}
        <FormItem className="md:col-span-2" label="Request Description" invalid={Boolean(errors.request_description)} errorMessage={errors.request_description?.message}>
            <Controller
                name="request_description"
                control={control}
                render={({ field }) => (
                    <Input textArea rows={4} placeholder="Describe your request in detail..." {...field} />
                )}
            />
        </FormItem>

        {/* Request Status */}
        <FormItem label="Request Status" invalid={Boolean(errors.request_status)} errorMessage={errors.request_status?.message}>
            <Controller
                name="request_status"
                control={control}
                render={() => (
                    <Select placeholder="Select status"
                    options={[
                        { value: 'Pending', label: 'Pending' },
                        { value: 'In Progress', label: 'In Progress' },
                        { value: 'Resolved', label: 'Resolved' },
                    ]}
                    >
                    </Select>
                )}
            />
        </FormItem>

        {/* Feedback Type */}
        <FormItem label="Feedback Type" invalid={Boolean(errors.feedback_type)} errorMessage={errors.feedback_type?.message}>
            <Controller
                name="feedback_type"
                control={control}
                render={() => (
                    <Select placeholder="Select feedback type"
                    options={[
                        { value: 'Suggestion', label: 'Suggestion' },
                        { value: 'Complaint', label: 'Complaint' },
                        { value: 'Experience', label: 'Experience' },
                    ]}
                    />
                )}
            />
        </FormItem>

        {/* Feedback Message */}
        <FormItem className="md:col-span-2" label="Feedback Message" invalid={Boolean(errors.feedback_message)} errorMessage={errors.feedback_message?.message}>
            <Controller
                name="feedback_message"
                control={control}
                render={({ field }) => (
                    <Input textArea rows={4} placeholder="Your feedback..." {...field} />
                )}
            />
        </FormItem>

        {/* Rating */}
        <FormItem label="Rating" invalid={Boolean(errors.feedback_rating)} errorMessage={errors.feedback_rating?.message}>
        <Controller
            name="feedback_rating"
            control={control}
            render={({ field }) => (
            <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    onClick={() => field.onChange(star)}
                    style={{
                    fontSize: '24px',
                    color: star <= (field.value || 0) ? '#ffc107' : '#e4e5e9',
                    userSelect: 'none',
                    }}
                    role="button"
                    aria-label={`${star} Star`}
                >
                    ★
                </span>
                ))}
            </div>
            )}
        />
        </FormItem>


        {/* Submitted On */}
        <FormItem label="Submitted On" invalid={Boolean(errors.submitted_on)} errorMessage={errors.submitted_on?.message}>
            <Controller
                name="submitted_on"
                control={control}
                render={({ field }) => (
                    <DatePicker
                        labelFormat={{
                            month: 'MMMM',
                            year: 'YY',
                        }}
                        defaultValue={new Date()}
                    />
                )}
            />
        </FormItem>

        {/* Submitted By */}
        <FormItem label="Submitted By" invalid={Boolean(errors.submitted_by)} errorMessage={errors.submitted_by?.message}>
            <Controller
                name="submitted_by"
                control={control}
                render={({ field }) => (
                    <Input type="text" placeholder="Member ID or email" {...field} />
                )}
            />
        </FormItem>

    </div>
</Card>


    )
}

export default RequestAndFeedbacksDetails
