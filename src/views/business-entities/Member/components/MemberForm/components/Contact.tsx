import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type ContactDetailSectionProps = FormSectionBaseProps
const ContactDetails = ({
    control,
    errors,
}: ContactDetailSectionProps) => {

    return (
        <Card id="socialContactInformation">
            <h4 className="mb-6">Social & Contact Information</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem
                    label="WhatsApp No."
                    invalid={Boolean(errors.whatsapp_number)}
                    errorMessage={errors.whatsapp_number?.message}
                >
                    <Controller
                        name="whatsapp_number"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter WhatsApp number" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Alternate Contact Number"
                    invalid={Boolean(errors.alternate_contact_number)}
                    errorMessage={errors.alternate_contact_number?.message}
                >
                    <Controller
                        name="alternate_contact_number"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter alternate contact number" {...field} />
                        )}
                    />
                </FormItem>

                
                <FormItem
                    label="Alternate Email"
                    invalid={Boolean(errors.alternate_email)}
                    errorMessage={errors.alternate_email?.message}
                >
                    <Controller
                        name="alternate_email"
                        control={control}
                        render={({ field }) => (
                            <Input type="email" autoComplete="off" placeholder="Enter alternate email" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Botim ID"
                    invalid={Boolean(errors.botim_id)}
                    errorMessage={errors.botim_id?.message}
                >
                    <Controller
                        name="botim_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Botim ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Skype ID"
                    invalid={Boolean(errors.skype_id)}
                    errorMessage={errors.skype_id?.message}
                >
                    <Controller
                        name="skype_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Skype ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="WeChat ID"
                    invalid={Boolean(errors.wechat_id)}
                    errorMessage={errors.wechat_id?.message}
                >
                    <Controller
                        name="wechat_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter WeChat ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="LinkedIn Profile"
                    invalid={Boolean(errors.linkedin_profile)}
                    errorMessage={errors.linkedin_profile?.message}
                >
                    <Controller
                        name="linkedin_profile"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="LinkedIn profile URL" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Facebook Profile"
                    invalid={Boolean(errors.facebook_profile)}
                    errorMessage={errors.facebook_profile?.message}
                >
                    <Controller
                        name="facebook_profile"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Facebook profile URL" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Instagram Handle"
                    invalid={Boolean(errors.instagram_handle)}
                    errorMessage={errors.instagram_handle?.message}
                >
                    <Controller
                        name="instagram_handle"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="@instagramhandle" {...field} />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default ContactDetails
